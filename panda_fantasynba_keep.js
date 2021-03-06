/**
梦幻NBA cookie保活
*\/2 * * *
**/

const { send } = require("./notify")

const axios = require("axios").default
const URL = require("url").URL

async function main() {
    try {
        const md = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000 + 60 * 60 * 24 * 1000).toLocaleDateString('zh-CN', { hour12: false }).replace(/\//g, '-')
        const api = new URL("https://www.fantasynba.cn/wx/include/post/viewteam/viewteam_nba_classic.php")
        const { data } = await axios.post(api.href, `userid=7330&md=${md}`, {
            headers: {
                Cookie: process.env.NBA_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        if (!data?.code) {
            send(`*梦幻NBA cookie保活*\n cookie失效了`)
        }
    } catch (error) {
        console.log(error.message);
    }
}

main()