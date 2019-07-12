/* eslint-disable indent */
'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request-promise');
const hex = require('string-hex');

const config = require('./config.json');
const lineapi = require('./linemessage.json');

const replyWelcomeMessage = require('./mesage_modules/replyWelcomeMessage');
const replyMessage = require('./mesage_modules/common/replyMessage');
const authStaff = require('./mesage_modules/authStaff');
const deregisterStaff = require('./mesage_modules/deregisterStaff');
const callNextQue = require('./mesage_modules/callNextQue');
const getQueList = require('./mesage_modules/getQueList');

const app = express();

app.get('/', function (req, response) {
  response.send('G-ABLE LINE API frok by Pod v.1.1.0');
});

// webhook callback
app.post('/webhook', line.middleware(config), (req, response) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return response.status(500).end();
  }
  // handle events separately
  Promise.all(req.body.events.map(event => {
    console.log('event', event);
    // check verify webhook event
    if (event.replyToken === '00000000000000000000000000000000' ||
      event.replyToken === 'ffffffffffffffffffffffffffffffff') {
      return null;
    }
    const userId = req.body.events[0].source.userId;
    const message = req.body.events[0].message;
    const replyToken = req.body.events[0].replyToken;

    getAllDeptname(response);

    switch (req.body.events[0].type) {
      case 'message':
        {
          switch (message.type) {
            case 'text':
              {
                switch (message.text) {
                  case `DREG`:
                    {
                      deregisterStaff(userId, replyToken, response);
                      break;
                    }
                  case `เรียกคิวถัดไป`:
                    {
                      callNextQue(userId, replyToken, response);
                      break;
                    }
                  case `รายการคิว`:
                    {
                      getQueList(userId, replyToken, response);
                      break;
                    }
                  default:
                    {
                      authStaff(userId, message.text, replyToken, response);
                      if (message.text.substring(0, 15) === `ยืนยันการจองคิว` && global.deptnameArray.includes(message.text.substring(15))) {
                        joinTheQueue(encodeURI(message.text.substring(15)), userId, replyToken, response);
                        break;
                      }
                      if (message.text.substring(0, 6) === `จองคิว` && global.deptnameArray.includes(message.text.substring(6))) {
                        quickReplyBeacon(message.text.substring(6), replyToken, response);
                        break;
                      }
                      break;
                    }
                }
                break;
              }

            case 'sticker':
              {
                const type = `enter`;
                const hwid = `012cbd1c3f`;
                if (type === `enter`) {
                  interactBeacon(hwid, userId, 1, replyToken, response);
                } else if (type === `leave`) {
                  interactBeacon(hwid, userId, 0, replyToken, response);
                }
                break;
              }

            default:
              throw new Error(`Unknown message: ${JSON.stringify(message)}`);
          }
          break;
        }

      case 'follow':
        replyWelcomeMessage(replyToken, response);
        break;

      case 'beacon':
        {
          const type = `${req.body.events[0].beacon.type}`;
          const hwid = `${req.body.events[0].beacon.hwid}`;
          if (type === `enter`) {
            interactBeacon(hwid, userId, 1, replyToken, response);
          } else if (type === `leave`) {
            interactBeacon(hwid, userId, 0, replyToken, response);
          }
          break;
        }

      default:
        throw new Error(`Unknown event: ${JSON.stringify(req.body.events[0])}`);
    }
  })).then(() => {
    response.status(200).end();
  }).catch((error) => {
    console.error(error);
    response.status(500).end();
  });
});

//* *************************************************************interactBeacon **************************************************************/

const getAllDeptname = (response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/deptall`,
    json: true,
  }).then((res) => {
    const status = `${res.status}`;
    if (status === `valid`) {
      global.deptnameArray = `${res.deptname}`;
      return response.status(200).end();
    }
    return response.status(200).end();
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const interactBeacon = (hwid, userId, statusid, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/user/inserttempbeacon/${hwid}/${userId}/${statusid}`,
    json: true,
  }).then((res) => {
    const status = `${res.status}`;
    const deptname = `${res.data.deptname}`;
    if (status === `success`) {
      insertTimestamp(hwid, userId, statusid, response);
      if (statusid === 1) {
        return replyJoinTheQueueMessage(hwid, deptname, replyToken, response);
      } else if (statusid === 0) {
        return replyMessage(`ท่านได้ออกจาก${deptname} แล้ว`, replyToken, response);
      }
      return response.status(200).end();
    }
    return response.status(200).end();
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const replyJoinTheQueueMessage = (hwid, deptname, replyToken, response) => {
  return request({
    method: `POST`,
    uri: `${lineapi.LINE_MESSAGING_API}/reply`,
    headers: lineapi.LINE_HEADER,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          'type': 'flex',
          'altText': `จองคิว${deptname}`,
          'contents': {
            'type': 'bubble',
            'direction': 'ltr',
            'header': {
              'type': 'box',
              'layout': 'vertical',
              'contents': [
                {
                  'type': 'text',
                  'text': `${deptname}`,
                  'align': 'center',
                  'weight': 'bold',
                },
              ],
            },
            'hero': {
              'type': 'image',
              'url': `https://suthinanhome.files.wordpress.com/2019/07/enter_dept_${hwid}.jpg`,
              'size': 'full',
              'aspectRatio': '1.51:1',
              'aspectMode': 'fit',
            },
            'footer': {
              'type': 'box',
              'layout': 'horizontal',
              'contents': [
                {
                  'type': 'button',
                  'action': {
                    'type': 'message',
                    'label': 'จองคิว',
                    'text': `จองคิว${deptname}`,
                  },
                  'style': 'primary',
                },
              ],
            },
          },
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

const quickReplyBeacon = (deptname, replyToken, response) => {
  return request({
    method: `POST`,
    uri: `${lineapi.LINE_MESSAGING_API}/reply`,
    headers: lineapi.LINE_HEADER,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: `ท่านต้องการที่จะจองคิวสัมภาษณ์${deptname} หรือไม่ ?`,
          quickReply: {
            items: [
              {
                type: 'action',
                imageUrl: 'https://suthinanhome.files.wordpress.com/2019/06/checked-1.png',
                action: {
                  type: 'message',
                  label: 'ยืนยัน',
                  text: `ยืนยันการจองคิว${deptname}`,
                },
              },
              {
                type: 'action',
                imageUrl: 'https://suthinanhome.files.wordpress.com/2019/06/cancel-1.png',
                action: {
                  type: 'message',
                  label: 'ยกเลิก',
                  text: 'ยกเลิก',
                },
              },
            ],
          },
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

const insertTimestamp = (hwid, userId, statusid, response) => {
  if (statusid === 1) {
    global.timestampstatus = `in`;
  } else {
    global.timestampstatus = `out`;
  }
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/user/beacon/${global.timestampstatus}/${hwid}/${userId}`,
    json: true,
  }).then(() => {
    return response.status(200).end();
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

//* *************************************************************interactBeacon **************************************************************/

const joinTheQueue = (deptname, userId, replyToken, response) => {
  return request({
    method: `GET`,
    uri: `https://webapi.linequeuegable.dev.nextliving.co/user/inserttempque/${deptname}/${userId}`,
    json: true,
  }).then((res) => {
    if (res.duplicate === `NO`) {
      const remaining = `${res.success.remaining}`;
      if (remaining <= 6) {
        return topQueImagemap(remaining - 1, userId, replyToken, response);
      }
      return replyMessage(`กรุณารออีก ${remaining - 1} คิว`, replyToken, response);
    }
    return replyMessage(`ท่านได้ทำการจองคิวไปแล้ว กรุณารอการเรียกคิว`, replyToken, response);
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const topQueImagemap = (remaining, userId, replyToken, response) => {
  if (remaining === 0) {
    global.altText = `ถึงคิวของคุณแล้ว`;
  } else {
    global.altText = `กรุณารออีก ${remaining} คิว`;
  }
  return request({
    method: `POST`,
    uri: `${lineapi.LINE_MESSAGING_API}/reply`,
    headers: lineapi.LINE_HEADER,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: 'imagemap',
          baseUrl: `https://suthinanhome.files.wordpress.com/2019/06/q${remaining}-5.jpg?w=1040`,
          altText: global.altText,
          baseSize: {
            width: 1040,
            height: 702,
          },
          actions: [],
        },
      ],
    }),
  }).then(() => {
    return insertUserDisplayName(userId, response);
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const insertUserDisplayName = (userId, response) => {
  request({
    method: `GET`,
    uri: `https://api.line.me/v2/bot/profile/${userId}`,
    headers: lineapi.LINE_HEADER,
    json: true,
  }).then((res) => {
    const name = `${res.displayName}`;
    const hexname = hex(name);
    return request({
      method: `GET`,
      uri: `https://webapi.linequeuegable.dev.nextliving.co/officer/insertnameuser/${userId}/${hexname}`,
      json: true,
    });
  }).catch((error) => {
    console.error(error);
    return response.status(500).end();
  });
};

const port = config.port;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
