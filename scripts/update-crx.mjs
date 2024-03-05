import path from 'path'
import fs from 'fs'
import crxConfig from '../crx.json' assert { type: "json" };

// 例子：https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3Dnhdogjmejiglipccpnnnanhbledajbpd%26uc&prodversion=32
// 从文件名抽取版本号
const saveCrx = async function(extensionId, filePath) {
    const response = await fetch(`https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc&prodversion=32`, {
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

const updateCrx = async function() {
    const crxIds = Object.keys(crxConfig);

    for (let id of crxIds) {
        const config = crxConfig[id]
        console.log('更新：', id);
        const { version } = await saveCrx(id, path.resolve(process.cwd(), './overrides', `${id}.crx`));
        console.log(`更新：`, id, `版本 ${config.version} to ${version}`);
        config.version = version
        config.id = id
    }

    console.log('更新：crx.json', );
    fs.writeFileSync(path.resolve('../crx.json'), JSON.stringify(crxConfig, null, 4))

    console.log('更新完成', );
}

updateCrx()