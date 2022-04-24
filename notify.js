const { default: axios } = require("axios")

module.exports = {
    send: async (message) => {
        try {
            const { data: ok } = await axios.post(
                `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
                {
                    chat_id: process.env.TG_USER_ID,
                    text: message,
                    disable_web_page_preview: true,
                    parse_mode: 'Markdown'
                }
            )
            if (ok) {
                console.log('Telegram通知消息发送成功');
            }
        } catch (error) {
            if (error.isAxiosError) {
                const { response: { data: { description } } } = error
                console.log(`Telegram通知消息发送失败:${description}`);
            } else {
                console.log(error.message);
            }
        }
    }
} 