const request = require('request-promise');
const replyMessage = require('./common/replyMessage');
const lineapi = require('../linemessage.json');

const callNextQue = (userId, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/checkofficer/${userId}`,
    json: true,
  }).then((res) => {
    const status = `${res.status}`;
    if (status === `success`) {
      const valid = `${res.valid}`;
      const hwid = `${res.hwid}`;
      if (valid === `YES`) {
        return requestnNextQue(hwid, replyToken, response);
      }
    }
    return response.status(200).end();
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const requestnNextQue = (hwid, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://linegable-api.pod.in.th/officer/next/${hwid}`,
    json: true,
  }).then((res) => {
    const status = `${res.status}`;
    if (status === `success`) {
      const nuserid = `${res.userid}`;
      return replyNextQueMessage(`${nuserid}`, replyToken, response);
    }
    return replyMessage(`ไม่มีคิวแล้ว`, replyToken, response);
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const replyNextQueMessage = (nuserid, replyToken, response) => {
  request({
    method: `GET`,
    uri: `https://api.line.me/v2/bot/profile/${nuserid}`,
    headers: lineapi.LINE_HEADER,
    json: true,
  }).then((res) => {
    const name = `${res.displayName}`;
    replyMessage(`คิวถัดไป คุณ ${name}`, replyToken, response);
    return pushNextQueMessage(nuserid, response);
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const pushNextQueMessage = (nuserid, response) => {
  return request({
    method: `POST`,
    uri: `${lineapi.LINE_MESSAGING_API}/push`,
    headers: lineapi.LINE_HEADER,
    body: JSON.stringify({
      to: nuserid,
      messages: [
        {
          type: 'imagemap',
          baseUrl: `https://suthinanhome.files.wordpress.com/2019/06/q0-1.jpg?w=1040`,
          altText: `ถึงคิวของคุณแล้ว`,
          baseSize: {
            width: 1040,
            height: 1193,
          },
          actions: [],
        },
      ],
    }),
  }).then(() => {
    return response.status(200).end();
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

module.exports = callNextQue;
