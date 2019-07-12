const request = require('request-promise');
const replyMessage = require('./common/replyMessage');
const lineapi = require('../linemessage.json');

const authStaff = (userId, account, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/accountstaff/${account}`,
    json: true,
  }).then((res) => {
    const status = `${res.status}`;
    if (status === `valid`) {
      const staffHwid = `${res.hwid}`;
      return registerStaff(userId, staffHwid, replyToken, response);
    } else {
      return response.status(200).end();
    }
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const registerStaff = (userId, staffHwid, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/registerofficer/${userId}/${staffHwid}`,
    json: true,
  }).then((res) => {
    const tied = `${res.tied}`;
    if (tied === `NO`) {
      const hwvalid = `${res.hwvalid}`;
      if (hwvalid === `YES`) {
        const hwduplicate = `${res.hwduplicate}`;
        if (hwduplicate === `NO`) {
          const deptname = `${res.deptname}`;
          enableStaffRichMenu(userId, response);
          return replyMessage(`ยินดีด้วย! คุณได้เป็น Staff ${deptname} แล้ว`, replyToken, response);
        } else {
          return replyMessage(`ไม่สามารถลงทะเบียนได้ เนื่องจากมี Staff ประจำแผนกอยู่แล้ว`, replyToken, response);
        }
      } else {
        return replyMessage(`ไม่มีอุปกรณ์ HWID: ${staffHwid} ในระบบ`, replyToken, response);
      }
    } else {
      const deptname = `${res.deptname}`;
      enableStaffRichMenu(userId, response);
      return replyMessage(`คุณเป็น Staff ประจำ ${deptname} อยู่แล้ว`, replyToken, response);
    }
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const enableStaffRichMenu = (userId, response) => {
  return request({
    method: `GET`,
    uri: `https://api.line.me/v2/bot/richmenu/list`,
    headers: lineapi.LINE_HEADER,
    json: true,
  }).then((res) => {
    const richMenuId = `${res.richmenus[0].richMenuId}`;
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

module.exports = authStaff;
