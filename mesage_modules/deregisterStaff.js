const request = require('request-promise');
const replyMessage = require('./common/replyMessage');
const lineapi = require('../linemessage.json');

const deregisterStaff = (userId, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/logoutofficertable/${userId}`,
    json: true,
  }).then((res) => {
    const status = `${res.status}`;
    if (status === `success`) {
      return disableStaffRichMenu(userId, replyToken, response);
    } else {
      return replyMessage(`คุณไม่ได้เป็น Staff อยู่แล้ว`, replyToken, response);
    }
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const disableStaffRichMenu = (userId, replyToken, response) => {
  return request({
    method: `DELETE`,
    uri: `https://api.line.me/v2/bot/user/${userId}/richmenu`,
    headers: lineapi.LINE_HEADER,
  }).then(() => {
    return enableUserRichMenu(userId, replyToken, response);
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const enableUserRichMenu = (userId, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://api.line.me/v2/bot/richmenu/list`,
    headers: lineapi.LINE_HEADER,
    json: true,
  }).then((res) => {
    const richMenuId = `${res.richmenus[1].richMenuId}`;
    replyMessage(`คุณได้ยกเลิกการเป็น Staff แล้ว!`, replyToken, response);
    return request({
      method: `POST`,
      uri: `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
      headers: lineapi.LINE_HEADER,
    });
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

module.exports = deregisterStaff;
