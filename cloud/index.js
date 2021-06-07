'use strict';

const HEADER_KEY = "x-github-event";

const actionWords = {
    "opened": `\<font color= \"info\"\>**发起**\</font\>`,
    "closed": `\<font color= \"comment\"\>**关闭**\</font\>`,
    "reopened": "重新发起",
    "edited": "更新",
    "merge": "合并",
    "created": "创建",
    "requested": "请求",
    "completed": "完成",
    "synchronize": "同步更新"
};

const querystring = require('querystring');
const ChatRobot = require('./chat');

/**
 * 处理ping事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handlePing(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );

    const {
        repository
    } = body;
    const msg = "成功收到了来自Github的Ping请求，项目名称：" + repository.name;
    await robot.sendTextMsg(msg);
    return msg;
}

/**
 * 处理push事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handlePush(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        pusher,
        repository,
        commits,
        ref
    } = body;
    const user_name = pusher.name;
    //const lastCommit = commits[0];
    var msgNum = 0;
    if (commits.length >= 5) {
        msgNum = 5
    } else {
        msgNum = commits.length
    }
    var mdMsg = `✋\<font color= \"info\"\>**收到一次push提交**\</font\>
本次commit数:${commits.length}
项目: [${repository.name}](${repository.url}) 
提交者:  [${user_name}](https://github.com/${user_name})
分支:  [${ref}](${repository.url}/tree/${ref})
信息: `;
    for (let i = msgNum - 1; i >= 0; i--) {
        mdMsg +=
            `\n * ${commits[i].message}`;
    }
    await robot.sendMdMsg(mdMsg);
    return mdMsg;
}

/**
 * 处理merge request事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handlePR(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        action,
        sender,
        pull_request,
        repository
    } = body;
    const mdMsg =
        `🙏\<font color= \"warning\"\>**收到一次PR操作**\</font\>
> 项目：[${repository.full_name}](${repository.html_url})
> 操作：${actionWords[action]}
> 操作者：[${sender.login}](https://github.com/${sender.login})
> 标题：${pull_request.title}
> 源分支：${pull_request.head.ref}
> 目标分支：${pull_request.base.ref}
[查看PR详情](${pull_request.html_url})`;
    await robot.sendMdMsg(mdMsg);
    return mdMsg;
}

/**
 * 处理issue 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handleIssue(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        action,
        issue,
        repository
    } = body;
    if (action !== "opened") {
        return `除非有人开启新的issue，否则无需通知机器人`;
    }
    const mdMsg =
        `👀**有人在 [${repository.name}](${repository.html_url}) ${actionWords[action]}了一个issue**
> 标题：${issue.title}
> 发起人：[${issue.user.login}](${issue.user.html_url})
[查看详情](${issue.html_url})`;
    await robot.sendMdMsg(mdMsg);
    return;
}

/**
 * 处理Release 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handleRelease(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        action,
        repository,
        sender,
        release
    } = body;
    if (action !== "published") {
        return "只接受发布信息";
    }
    const mdMsg =
        `✨\<font color= \"warning\"\>**发布了Release**\</font\>
> 项目: [${repository.full_name}](${repository.html_url})
> 版本: ${release.tag_name}
> 标题: ${release.name}
> 发布者: [${sender.login}](${sender.html_url})
> [查看详情](${release.html_url})`;
    await robot.sendMdMsg(mdMsg);
    return;
}

/**
 * 处理 Issue Comment 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handleIssueComment(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        action,
        issue,
        comment,
        repository
    } = body;
    if (action !== "created") {
        return "只接受发布评论";
    }
    const mdMsg =
        `🗯**有人发布了一条Issue评论**
> 项目: [${repository.full_name}](${repository.html_url})
> Issue标题: [${issue.title}](${issue.html_url})
> 回复人: [${comment.user.login}](${comment.user.html_url})
> 回复内容: ${comment.body}
> [查看详情](${comment.html_url})`;
    await robot.sendMdMsg(mdMsg);
    return;
}

/**
 * 处理 commit comment 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handleCommitComment(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        repository,
        comment
    } = body;
    const mdMsg =
        `✅**接收到一条blame**
> 项目: [${repository.full_name}](${repository.html_url})
> 文件: ${comment.path}
> 行数: \`${comment.line}\` 
> 操作者: [${comment.user.login}](${comment.user.html_url})
> 内容: ${comment.body}
> [查看详情](${comment.html_url})`;
    await robot.sendMdMsg(mdMsg);
    return;
}


/**
 * 处理 pr review comment 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handlePRReviewComment(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    const {
        repository,
        pull_request,
        comment
    } = body
    const mdMsg =
        `✊🏿**收到一条PR Review Comment**
> 项目: [${repository.full_name}](${repository.html_url})
> 操作者: [${comment.user.login}](${comment.user.html_url})
> PR标题: [${pull_request.title}](${pull_request.html_url})
> 评论内容: ${comment.body}
> [查看详情](${comment.html_url})`;
    await robot.sendMdMsg(mdMsg);
    return;
}

/**
 * 对于未处理的事件，统一走这里
 * @param ctx koa context
 * @param event 事件名
 */
function handleDefault(body, event) {
    return `Sorry，暂时还没有处理${event}事件`;
}

exports.main_handler = async (event, context, callback) => {
    console.log('event: ', event);
    if (!(event.headers && event.headers[HEADER_KEY])) {
        return 'Not a github webhook deliver'
    }
    const gitEvent = event.headers[HEADER_KEY]
    const robotid = event.queryString.id
    const query = querystring.parse(event.body);
    // console.log('query: ', query);
    const payload = JSON.parse(query.payload);
    console.log('payload: ', payload);
    console.log('robotid: ', robotid);
    switch (gitEvent) {
        case "push":
            return await handlePush(payload, robotid);
        case "pull_request":
            return await handlePR(payload, robotid);
        case "ping":
            return await handlePing(payload, robotid);
        case "issues":
            return handleIssue(payload, robotid);
        case "release":
            return handleRelease(payload, robotid);
        case "commit_comment":
            return handleCommitComment(payload, robotid);
        case "issue_comment":
            return handleIssueComment(payload, robotid);
        case "pull_request_review_comment":
            return handlePRReviewComment(payload, robotid);
        default:
            return handleDefault(payload, gitEvent);
    }
};