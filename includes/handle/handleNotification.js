'use strict';

// handleNotification — يُستدعى يدوياً من KIRA.js إذا أردت
// ليس event handler — بل دالة تُستدعى مرة بعد تسجيل الدخول

module.exports = function ({ api }) {
    const moment = require('moment-timezone');
    const HEADER = '⌬ ━━ 𝗞𝗜𝗥𝗔 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 ━━ ⌬';
    const ADMIN  = (global.config?.ADMINBOT || [])[0];
    if (!ADMIN) return;

    const botID = api.getCurrentUserID();
    const form  = {
        av: botID,
        fb_api_req_friendly_name: 'CometNotificationsDropdownQuery',
        fb_api_caller_class: 'RelayModern',
        doc_id: '5025284284225032',
        variables: JSON.stringify({
            count: 5,
            environment: 'MAIN_SURFACE',
            menuUseEntryPoint: true,
            scale: 1
        })
    };

    const getMinutesDiff = (t1, t2) =>
        Math.ceil((t2.getTime() - t1.getTime()) / 60000);

    try {
        api.httpPost('https://www.facebook.com/api/graphql/', form, (err, res) => {
            if (err) return;
            try {
                const a    = JSON.parse(res);
                const data = a?.data?.viewer;
                if (!data) return;
                const time = moment.tz('Asia/Baghdad').format('HH:mm:ss DD/MM/YYYY');

                for (const edge of (data.notifications_page?.edges || [])) {
                    if (edge.node?.row_type !== 'NOTIFICATION') continue;
                    const { body, url, creation_time } = edge.node.notif || {};
                    if (!body || !creation_time) continue;
                    const ts = creation_time.timestamp;
                    if (getMinutesDiff(new Date(ts * 1000), new Date()) > 1) continue;

                    api.sendMessage(
                        `${HEADER}\n\n⏱️ ${time}\n💬 ${body.text}\n🔗 ${url}`,
                        ADMIN
                    );
                }
            } catch (_) {}
        });
    } catch (_) {}
};
