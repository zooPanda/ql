/**
梦幻NBA 提交队伍
55 23 * * *
**/

const axios = require("axios").default
const URL = require("url").URL
const { delay } = require("./utils")
const { send } = require("./notify")

const md = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000 + 60 * 60 * 24 * 1000).toLocaleDateString('zh-CN', { hour12: false }).replace(/\//g, '-')

const position = {
    "PG": 1,
    "SG": 2,
    "SF": 3,
    "PF": 4,
    "C": 5
}

const Cookie = process.env.NBA_TOKEN

let notify = "*梦幻NBA*\n" + md + "\n"


async function getPlayerList() {
    const api = new URL("https://www.fantasynba.cn/wx/include/post/myteam/table_players_nba.php")
    api.searchParams.append("md", md)
    let list = []
    let times = 1
    for (let i = 0; i < times; i++) {
        console.log(`第 ${i + 1} 页 ${i ? "共 " + times + " 页" : ""}`);
        const { data } = await axios.post(api.href, `pagesize=1&pageoffset=${i}&select_team=0&select_pos=0&select_salary=0&select_order=0`, {
            headers: {
                Cookie: Cookie,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        if (data && data.code) {
            list = list.concat(data.rows[0].arrayplayers)
            times = data.total
        } else {
            send("梦幻NBA出错了," + data ? JSON.stringify(data) : "未知的错误")
            process.exit(0)
        }
        // await delay(2000)
    }
    return list
}
async function loadTeam() {
    const api = new URL("https://www.fantasynba.cn/wx/include/post/myteam/loadmyteam_nba.php")
    const { data } = await axios.post(api.href, `id=6`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie,
        }
    })
    if (data && data.code) {
        return data.data.arrayplayers
    } else {
        return []
    }
}
async function submitTeam(content) {
    const api = new URL("https://www.fantasynba.cn/wx/include/post/myteam/submitteam_nba.php")
    const { data } = await axios.post(api.href, content, {
        headers: {
            Cookie: Cookie,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    if (data && data.code) {
        console.log(data.data.msg);
        send(notify += `\n${data.data.msg}`)
    }
}
async function addPlayer(playerid) {
    const api = new URL("https://www.fantasynba.cn/wx/include/post/myteam/addplayer_nba.php")
    const { data } = await axios.post(api.href, `id=6&md=${md}&playerid=${playerid}`, {
        headers: {
            Cookie: Cookie,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    if (data && data.code) {
        if (typeof data.data.arrayplayer.playername === 'string') {
            console.log(`添加球员[${data.data.arrayplayer.playername}] 成功`);
        } else {
            console.log(`移除球员[${playerid}]成功`);
        }
    } else {
        console.log(data);
    }
}

async function main() {

    // 获取当前比赛日已选择球员列表
    const currentList = await loadTeam()
    if (currentList.length) {
        for (const vo of currentList) {
            await addPlayer(vo.playerid)
            await delay(2000)
        }
    }

    // 列出所有必选站位
    const pos = new Set()
    for (const vo of ["PG", "SG", "SF", "PF", "C"]) {
        pos.add(vo)
    }


    // 声明已选球员列表变量
    let selected_list = {}

    // 声明可使用经费
    let total_price = 8000


    // 获取比赛日所有球员名单
    console.log(`开始获取比赛日 ${md} 所有球员名单`);
    let list = await getPlayerList()
    console.log(`共获得 ${list.length} 名球员信息`);

    // 过滤出状态正常的球员名单
    list = list.filter(i => i.injury === '0')
    console.log(`其中 ${list.length} 名球员状态正常`);

    // 选择身价最高且状态正常的球员为队长
    const captain = list[0]

    // 将可用经费减去选购队长所需的经费
    total_price -= parseFloat(captain.salary)

    // 找出队长所属站位
    let captain_pos;
    if (captain.pos.indexOf("/")) {
        captain_pos = captain.pos.split("/")[0]
    } else {
        captain_pos = captain.pos
    }

    console.log(`\n队长:${captain.playername}\n    站位:${captain_pos}\n    身价:${captain.salary}W`);
    notify += `\n队长:${captain.playername}\n    站位:${captain_pos}\n    身价:${captain.salary}W`

    // 必选站位中移除队长所处站位
    pos.delete(captain_pos)

    // 将队长添加到已选列表中
    selected_list[captain_pos] = captain

    // 从球员列表中移除队长
    list = list.filter(i => i.playerid !== captain.playerid)

    // 声明第二梯队可用经费
    let second_total_price = total_price - 200 * 4
    // 第二梯队平均经费
    let second_average = parseFloat(second_total_price / 3)

    console.log(`\n第二梯队可用经费${second_total_price}W,平均每位球员经费约${second_average.toFixed(2)}W`);

    // 过滤一组第二梯队列表 身价
    let second_list = list.filter(i => parseFloat(i.salary) > second_average - 1000)
    second_list = second_list.filter(i => parseFloat(i.salary) < second_average + 200)

    console.log(`符合这条件的第二梯队列表共${second_list.length}位球员`);

    // 循环第二梯队列表
    for (let i = 0; i < second_list.length; i++) {
        // 获取列表中的每一个球员
        const item = second_list[i];

        // 获取球员站位
        let item_pos
        if (item.pos.indexOf("/")) {
            item_pos = item.pos.split("/")[0]
        } else {
            item_pos = item.pos
        }

        if (pos.size > 1) {

            // 如果球员站位符合必选站位
            if (pos.has(item_pos)) {

                // 将球员添加到已选列表中
                selected_list[item_pos] = item

                // 在必选站位中移除已存在的球员站位
                pos.delete(item_pos)

                // 将可用经费减去选购队员所需的经费
                total_price -= parseFloat(item.salary)

                // 将已选择的球员从球员列表中移除
                list = list.filter(i => i.playerid !== item.playerid)

                console.log(`\n队员:${item.playername}\n    站位:${item_pos}\n    身价:${item.salary}W`);
                notify += `\n队员:${item.playername}\n    站位:${item_pos}\n    身价:${item.salary}W`
            }
        } else {
            break;
        }
    }

    console.log(`\n剩余可用经费:${total_price}W`);

    // 计算第三梯队可用平均经费
    let third_average = parseFloat(total_price / 4)
    console.log(`第三梯队球员平均经费约${third_average.toFixed(2)}`);

    // 过滤出第三梯队球员
    list = list.filter(i => parseFloat(i.salary) < third_average + 50)
    console.log(`符合条件的球员共有${list.length}位`);

    // 声明最后一个必选站位
    let last_pos
    pos.forEach(v => {
        last_pos = v
    })

    // 符合最有一个必选站位的球员列表
    let last_pos_list = list.filter(i => i.pos.indexOf(last_pos) !== -1)

    // 选出符合最后一个必选站位的球员
    selected_list[last_pos] = last_pos_list[0]
    list = list.filter(i => i.playerid !== last_pos_list[0].playerid)

    console.log(`\n队员:${last_pos_list[0].playername}\n    站位:${last_pos_list[0].pos}\n    身价:${last_pos_list[0].salary}W`);
    notify += `\n队员:${last_pos_list[0].playername}\n    站位:${last_pos_list[0].pos}\n    身价:${last_pos_list[0].salary}W`
    // 总经费中减去最后一个必选站位的球员身价
    total_price -= parseFloat(last_pos_list[0].salary)

    // 计算替补球员平均可用经费
    let fourth_average = parseFloat(total_price / 3)
    console.log(`\n剩余可用经费:${total_price}W,替补球员平均可用经费${fourth_average.toFixed(2)}W`);

    // 根据平均可用经费过滤球员
    list = list.filter(i => parseFloat(i.salary) < fourth_average)

    // 在列表中根据场均得分排序
    list = list.sort((a, b) => a.fantasy - b.antasy)

    // 循环符合条件的球员列表，取场均得分前三的加入替补席
    for (let i = 0; i < 3; i++) {
        selected_list[`alt_${i}`] = list[i]
        console.log(`\n替补:${list[i].playername}\n    站位:${list[i].pos}\n    身价:${list[i].salary}W`);
        notify += `\n替补:${list[i].playername}\n    站位:${list[i].pos}\n    身价:${list[i].salary}W`
        total_price -= parseFloat(list[i].salary)
    }

    console.log(`\n本次选阵共花费${8000 - total_price}W,剩余${total_price}w`);
    notify += `\n本次选阵共花费${8000 - total_price}W,剩余${total_price}w`
    // 拼接提交选阵参数
    let c = `id=6&captain=${captain.playerid}&md=${md}&`
    for (const vo of Object.keys(selected_list)) {
        c += `arrayplayerid${encodeURIComponent("[]")}=${selected_list[vo].playerid}&`
    }
    for (const vo of Object.keys(selected_list)) {
        await addPlayer(selected_list[vo].playerid)
        await delay(3000)
        if (vo.indexOf("alt") !== -1) {
            c += `arraypos${encodeURIComponent("[]")}=6&`
        } else {
            c += `arraypos${encodeURIComponent("[]")}=${position[vo]}&`
        }
    }
    c = c.slice(0, c.length - 1)
    await submitTeam(c)
}
main().catch(async err => {
    send(`*梦幻NBA*\m${err.message}`)
})