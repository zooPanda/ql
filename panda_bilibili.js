const axios = require("axios").default
const { send } = require("./notify")

async function main() {
    try {
        const { data } = await axios.get("https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign", {
            headers: {
                cookie: process.env.BILI_TOKEN,
                accept: 'application/json'
            }
        })
        if (data && data.code === 0) {
            send(`*Bilibili 签到*\n当月共${data.data.allDays}天,已签到${data.data.hadSignDays}\n今日签到奖励:${data.data.text}`)
        } else {
            send(`*Bilibili 签到*\n${data.message}`)
        }
    } catch (error) {
        console.log(error.message);
    }
}

main()