import path from 'path'
import fs from 'fs'

const response = await fetch(`https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3Dnhdogjmejiglipccpnnnanhbledajbpd%26uc&prodversion=32`, {
    method: 'GET',
 })
 const buffer = await response.arrayBuffer()
 fs.writeFileSync(path.resolve(`aaa.crx`), Buffer.from(buffer))