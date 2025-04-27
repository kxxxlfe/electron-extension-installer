import path from 'path'
import fs from 'fs'
import crxConfig from '../src/crx.json' with { type: "json" };

const downloadFile = async function({ url, file }) {
    const response = await fetch(url, {
        method: 'GET',
    })
    const buffer = await response.arrayBuffer()
    fs.writeFileSync(file, Buffer.from(buffer))

    return response
}

// 例子：https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%iaajmlceplecbljialhhkmedjlpdblhp%26uc&prodversion=999999
// 从文件名抽取版本号
const saveCrx = async function(extensionId, filePath) {
    const response = await fetch(`https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx3&x=id%3D${extensionId}%26uc&prodversion=999999`, {
        method: 'GET',
     })
     const buffer = await response.arrayBuffer()
     fs.writeFileSync(filePath, Buffer.from(buffer))

     // 提取版本号数据
     let versionStr = response.url?.match(/_([\d_]*)\.crx$/)?.[1];
     versionStr = versionStr.split('_').join('.')
     versionStr = versionStr.endsWith('.0') ? versionStr.slice(0, -2) : versionStr

     return {
        version: versionStr
     };
}

const saveZIP = async function({ config, folder }) {
    let version = '0'
    const res = await fetch(config.githubRelease);
    const releases = await res.json()
    if (!releases?.length) {
        return { version };
    }

    const { name, assets } = releases[0]
    version = name;
    const latestZipUrl = assets[0]?.browser_download_url
    if (!latestZipUrl) {
        return { version }
    }

    await downloadFile({ url: latestZipUrl, file: path.resolve(folder, `${config.id}.zip`)});

    return {
        version: name
     };
}

const updateCrx = async function() {
    const crxIds = Object.keys(crxConfig);

    for (let id of crxIds) {
        const config = crxConfig[id]
        console.log('更新：', id);
        config.id = id
        const save = config.githubRelease ? 
            saveZIP({ config, folder: path.resolve(process.cwd(), './overrides') }): 
            saveCrx(id, path.resolve(process.cwd(), './overrides', `${id}.crx`))
        const { version } = await save;
        console.log(`更新：`, id, `版本 ${config.version} to ${version}`);
        config.version = version
    }

    console.log('更新：crx.json', );
    fs.writeFileSync(path.resolve(process.cwd(), 'src/crx.json'), JSON.stringify(crxConfig, null, 4))

    console.log('更新完成', );
}

updateCrx()