import type { LoadExtensionOptions, Session } from "electron";
import { session } from "electron";
import * as path from "path";
import * as rimraf from "rimraf";
import fsp from 'fs/promises'
import unzip from "./unzip";
import { changePermissions, fetchCrxFile, getExtensionPath, getIdMap } from "./utils";
import jetpack from "fs-jetpack";
import crxConfig from './crx.json'

// global options
let forceDownload = false
const pkgName = '@kxxxl-front-end/electron-extension-installer';

const getManifest = async (manifestDirectory: string) => {
  try {
    const file = await jetpack.readAsync(path.join(manifestDirectory, "manifest.json"), "json");
    return file;
  } catch (e) {
    return false;
  }
};

// These overrides are for extensions whose official CRX file hosted on google uses Chrome APIs unsupported by electron
// Thankfully collected by @xupea
const OVERRIDES = Object.keys(crxConfig);
async function downloadChromeExtension(chromeStoreID: string, chromeStoreVer: string, attempts = 5): Promise<string> {
  try {
    const extensionsStore = getExtensionPath();
    await jetpack.dirAsync(extensionsStore);
    const extensionFolder = path.resolve(`${extensionsStore}/${chromeStoreID}`);
    const extensionDirExists = await jetpack.existsAsync(extensionFolder);

    // 不强制下载，而且版本号匹配，走缓存
    if (extensionDirExists && !forceDownload) {
      if (chromeStoreVer) {
        const manifest = await getManifest(extensionFolder);
        if (manifest.version === chromeStoreVer) {
          return extensionFolder;
        }
      } else {
        return extensionFolder;
      }
    }

    // 下载流程
    if (extensionDirExists) {
      rimraf.sync(extensionFolder);
    }

    // 目标文件目录
    const filePath = path.resolve(`${extensionFolder}.crx`);

    // 直接使用pkg的缓存文件
    const pkgNodeRoot = require.resolve(pkgName)?.replace('dist/index.js', '') || '';
    const pkgExtPath = path.resolve(pkgNodeRoot, `./overrides/${chromeStoreID}.crx`);
    const pkgExtExist = await jetpack.existsAsync(pkgExtPath)
    // 直接拷贝文件
    if (pkgExtExist === 'file') {
      await jetpack.copyAsync(pkgExtPath, filePath, { overwrite: true })
    } 
    // 从git下载
    else {
      const chromeVersion = process.versions.chrome || 99999;
      // https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${nhdogjmejiglipccpnnnanhbledajbpd}%26uc&prodversion=32
      let fileURL = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${chromeStoreID}%26uc&prodversion=${chromeVersion}`;
      if (OVERRIDES.includes(chromeStoreID)) {
        fileURL = `https://github.com/kxxxlfe/electron-extension-installer/raw/main/overrides/${chromeStoreID}.crx`;
      }
      await fetchCrxFile(fileURL, filePath);
    }

    try {
      await unzip(filePath, extensionFolder);
      changePermissions(extensionFolder, 755);
      return extensionFolder;
    } catch (err: any) {
      if (!(await jetpack.existsAsync(path.resolve(extensionFolder, "manifest.json")))) {
        throw err;
      }
    }
  } catch (err) {
    console.log(`Failed to fetch extension, trying ${attempts - 1} more times`);
    if (attempts <= 1) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    return downloadChromeExtension(chromeStoreID, chromeStoreVer, attempts - 1);
  }

  throw new Error("Failed to fetch extension");
}

export interface ExtensionReference {
  /**
   * Extension ID
   */
  id: string;
  /**
   * Working version
   */
  version?: string;
  githubRelease?: string;
}

export interface ExtensionOptions {
  /**
   * Ignore whether the extension is already downloaded and redownload every time
   */
  forceDownload?: boolean;
  /**
   * Options passed to session.loadExtension
   */
  loadExtensionOptions?: LoadExtensionOptions;
  /**
   * The target session on which the extension shall be installed
   */
  session?: string | Session;
}

/**
 * @param extensionReference Extension or extensions to install
 * @param options Installation options
 * @returns A promise resolving with the name or names of the extensions installed
 */
export const installExtension = async (
  extensionReference: ExtensionReference | string | Array<ExtensionReference | string>,
  options: ExtensionOptions = {},
): Promise<string | string[]> => {
  const targetSession = typeof options.session === 'string' ? session.fromPartition(options.session) : options.session || session.defaultSession;
  const { loadExtensionOptions } = options;
  forceDownload = !!options.forceDownload

  if (process.type !== "browser") {
    throw new Error("electron-devtools-assembler can only be used from the main process");
  }

  if (Array.isArray(extensionReference)) {
    const installed = await Promise.all(extensionReference.map((extension) => installExtension(extension, options)));
    return installed.flat();
  }
  let chromeStoreID: string;
  let chromeStoreVer = ''
  if (typeof extensionReference === "object" && extensionReference.id) {
    chromeStoreID = extensionReference.id;
    chromeStoreVer = extensionReference.version || '';
  } else if (typeof extensionReference === "string") {
    chromeStoreID = extensionReference;
  } else {
    throw new Error(`Invalid extensionReference passed in: "${extensionReference}"`);
  }

  const IDMap = getIdMap();
  const extensionName = IDMap[chromeStoreID];
  // todo - should we check id here?
  const installedExtension = targetSession.getAllExtensions().find((e) => e.name === extensionName);

  if (!forceDownload && installedExtension) {
    return IDMap[chromeStoreID];
  }

  const extensionFolder = await downloadChromeExtension(chromeStoreID, chromeStoreVer);
  // Use forceDownload, but already installed
  if (installedExtension) {
    targetSession.removeExtension(installedExtension.id);
  }

  /*
  if (await isManifestVersion3(extensionFolder)) {
    throw new Error(`Manifest version 3 is not supported by electron. For more information, see:
    
    https://github.com/facebook/react/issues/25843
    https://github.com/electron/electron/issues/37876
    https://github.com/MarshallOfSound/electron-devtools-installer/issues/238
    https://github.com/electron/electron/blob/e3b7c3024f6f70155efb1022b691954280f983cb/docs/api/extensions.md#L1`);
  }
  */
  const ext = await targetSession.loadExtension(extensionFolder, loadExtensionOptions);
  return ext.name;
};
export default installExtension;
export * from "./extensions";
