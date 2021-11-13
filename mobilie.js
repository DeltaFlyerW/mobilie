'use strict'

var setting = {
    translateNicoComment: true,
    replaceKatakana: true,
    nicoDanmuRate: true,
}

function xmlunEscape(content) {

    return content.replace('；', ';')

        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&apos;', "'")
        .replace('&quot;', '"')
        .replace('&amp;', '&')
}

function main() {
    var aid, cid, count, epInfo, fModified, head, ipage, lCachedVideo, lNicoDanmuId, lbahaDanmuId,
        oldanmu, pCache, pEposide, pSeason, sdanmu, ss, videoInfo;
    pCache = "/storage/emulated/0/Android/data/tv.danmaku.bili/download";
    lCachedVideo = files.listDir(pCache);
    for (var video, _pj_c = 0, _pj_a = lCachedVideo, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        video = _pj_a[_pj_c];
        if ((video.startsWith("s_"))) {
            pSeason = ((pCache + "/") + video);
            if ((!files.isDir(pSeason))) {
                continue;
            }
            ss = Number.parseInt(video.slice(2));
            for (var ep, _pj_f = 0, _pj_d = files.listDir(pSeason), _pj_e = _pj_d.length; (_pj_f < _pj_e); _pj_f += 1) {

                ep = _pj_d[_pj_f];

                pEposide = ((pSeason + "/") + ep);

                epInfo = parseJsonFile(pEposide + "/entry.json")
                if (_pj_f === 0) {
                    console.log(video, epInfo['title']);
                }

                ipage = epInfo["ep"]["page"];
                aid = epInfo["ep"]["av_id"];
                cid = epInfo["ep"]["danmaku"];
                console.log('ep', ep, epInfo['ep']['index'], epInfo['ep']['index_title']);

                oldanmu = open((pEposide + "/danmaku.xml"), 'r', "utf-8").read();
                head = oldanmu.slice(0, (oldanmu.indexOf("</source>") + 9));
                var ndanmu = /<maxlimit>(\d+)<\/maxlimit>/.exec(head)[1]
                lbahaDanmuId = findAll(/bahamute,(\d+)"/g, oldanmu)
                lNicoDanmuId = findAll(/,.{9,},(\d+)"/g, oldanmu)
                oldanmu = findAll(/(<d p=".*?d>)/g, oldanmu)
                console.log('len(oldanmu)', len(oldanmu))
                fModified = (head.indexOf("<source>DF</source>") !== (-1));
                if (fModified) {
                    console.log('skip due to already modified')
                    continue
                }
                if ((!fModified)) {
                    console.log("load subtitle");
                    var res = subtitle(aid, cid)
                    oldanmu = oldanmu.concat(res);
                    head = head.replace("<source>k-v</source>", "<source>DF</source>");
                }
                sdanmu = head + oldanmu.join('') + "</i>"
                try{
                    var [nicoDanmu, bahaDanmu] = mergeOutsideDanmaku(ss, ipage, ndanmu)
                    count = 0;
                    var tldanmu = danmuObject2XML(nicoDanmu)
                    for (var danmu, _pj_i = 0, _pj_g = nicoDanmu, _pj_h = _pj_g.length; (_pj_i < _pj_h); _pj_i += 1) {
                        danmu = _pj_g[_pj_i];
                        if (lNicoDanmuId.indexOf(danmu.idStr) === -1 && !danmu.content.match(outsideFliter)) {
                            count += 1
                            oldanmu.push(tldanmu[_pj_i]);
                        }
                    }
                    if ((count !== (-0))) {
                        console.log("Add", count, "from niconico");
                    }
                    count = 0;
                    tldanmu = danmuObject2XML(bahaDanmu)

                    for (var danmu, _pj_i = 0, _pj_g = bahaDanmu, _pj_h = _pj_g.length; (_pj_i < _pj_h); _pj_i += 1) {
                        danmu = _pj_g[_pj_i];
                        if (lbahaDanmuId.indexOf(danmu.idStr) === -1 && !danmu.content.match(outsideFliter)) {
                            count += 1;
                            oldanmu.push(tldanmu[_pj_i]);
                        }
                    }
                    if ((count !== (-0))) {
                        console.log("Add", count, "from baha");
                    }
                }catch (e) {
                    console.log(e)
                }
                sdanmu = (head + oldanmu.join('') + "</i>");
                console.log('len(ldanmu)', len(oldanmu), len(sdanmu))
                var file = open((pEposide + "/danmaku.xml"), "w", 'utf-8')
                file.write(sdanmu)
                file.close()
            }
        } else {
            aid = video;
            if ((!files.isFile((pvideo + "/videoinfo.json")))) {
                videoInfo = http.get(("https://api.bilibili.com/x/web-interface/view?aid=" + aid)).body.json()["data"];
                dump(videoInfo, (pvideo + "/videoinfo.json"));
            } else {
                videoInfo = load((pvideo + "/videoinfo.json"));
            }
            var lNicoID = [];
            var tlNicoID = findAll(/sm\d+/g, videoInfo["desc"]);
            for (var nicoID, _pj_f = 0, _pj_d = tlNicoID, _pj_e = _pj_d.length; (_pj_f < _pj_e); _pj_f += 1) {
                nicoID = _pj_d[_pj_f];
                if (lNicoID.indexOf(tlNicoID) === -1) {
                    lNicoID.push(nicoID);
                }
            }
            if ((lNicoID.length === 0)) {
                continue;
            }
            var lPart = files.listDir(pvideo);
            for (var part, _pj_f = 0, _pj_d = lPart, _pj_e = _pj_d.length; (_pj_f < _pj_e); _pj_f += 1) {
                part = _pj_d[_pj_f];
                var ppart = ((pvideo + "/") + part);
                if ((!os.path.isdir(ppart))) {
                    continue;
                }
                var partInfo = load((ppart + "/entry.json"));
                var page = partInfo["page_data"]["page"];
                oldanmu = open((ppart + "/danmaku.xml"), 'r', "utf-8").read();
                head = oldanmu.slice(0, (oldanmu.indexOf("</source>") + 9));
                var ndanmu = /<maxlimit>(\d+)<\/maxlimit>/.exec(head)[1]

                if (head.indexOf("<source>DF</source>") !== (-1)) {
                    continue
                } else {
                    head = head.replace("<source>k-v</source>", "<source>DF</source>");
                }
                console.log(page, lNicoID[(page - 1)]);
                var url = "https://delflare505.win:800/nico/?nicoid=" + lNicoID[(page - 1)]
                if (setting.nicoDanmuRate) {
                    url += '&niconum=' + Math.floor(ndanmu * setting.nicoDanmuRate)
                }
                nicoDanmu = http.get(url).body.string();
                nicoDanmu = parseNicoResponse(nicoDanmu, 0)
                if (setting.translateNicoComment) {
                    nicoDanmu = translateNico(ldanmu)
                }
                oldanmu = oldanmu.concat(nicoDanmu)
                sdanmu = ((head + "".join(oldanmu)) + "</i>");
                open((pEposide + "/danmaku.xml"), "w", 'utf-8').write(sdanmu);
            }
        }
    }
}


function parseJsonFile(path) {
    return JSON.parse(open(path, 'r', 'utf-8').read())
}

function dump(obj, path) {
    open(path, 'w', 'utf-8').write(JSON.stringify(obj))
}

function genNicoAPIBody(lthread, duration) {
    var body = [{
        "ping": {
            "content": "rs:0"
        }
    },
        {
            "ping": {
                "content": "ps:0"
            }
        },]
    var ipart = 0
    var minute = (Math.floor((duration - 1) / 60) + 1).toString()
    var isOwnerThread = lthread[0]['isOwnerThread']
    for (var i = 0; i < lthread.length; i++) {
        var part = lthread[i]
        if (!part['isActive']) {
            continue
        }
        var thread = {
            "thread": part['id'].toString(),
            "version": "20090904",
            "fork": part["fork"],
            "language": 0,
            "user_id": "",
            "with_global": 1,
            "scores": 1,
            "nicoru": 3,
        }
        if (isOwnerThread && ipart === 0) {
            thread['res_from'] = -1000
            thread['version'] = '20061206'
        }
        body.push({'thread': thread})
        body.push({
            "ping": {
                "content": 'pf:' + ipart.toString()
            }
        })
        body.push({
            "ping": {
                "content": 'ps:' + (ipart + 1).toString()
            }
        })
        ipart += 1
        if (ipart > 2 || part['isLeafRequired']) {
            body.push({
                "thread_leaves": {
                    "thread": part['id'].toString(),
                    "fork": part["fork"],
                    "language": 0,
                    "user_id": "",
                    "content": "0-" + minute.toString() + ":100,1000,nicoru:100",
                    "scores": 1,
                    "nicoru": 3,
                }
            })
            body.push({
                "ping": {
                    "content": 'pf:' + ipart.toString()
                }
            })
            body.push({
                "ping": {
                    "content": 'ps:' + (ipart + 1).toString()
                }
            })
            ipart += 1
        }
    }
    body[body.length - 1] = {
        "ping": {
            "content": "rf:0"
        }
    }
    return body
}

function parseNicoResponse(sdanmu, startIndex) {
    var ldanmu
    var dColor = {
        'red': 16711680, 'pink': 16744576, 'orange': 16763904, 'yellow': 16776960, 'green': 65280, 'cyan': 65535,
        'blue': 255, 'purple': 12583167, 'black': 0, 'niconicowhite': 13421721, 'white2': 13421721,
        'truered': 13369395, 'red2': 13369395, 'pink2': 16724940, 'passionorange': 16737792, 'orange2': 16737792,
        'madyellow': 10066176, 'yellow2': 10066176, 'elementalgreen': 52326, 'green2': 52326, 'cyan2': 52428,
        'marineblue': 3381759, 'blue2': 3381759, 'nobleviovar': 6697932, 'purple2': 6697932, 'black2': 6710886
    }
    if (sdanmu[0] === '<') {
        ldanmu = sdanmu.split('</d><d p=');

        if (ldanmu.length === 1) {
            return []
        }
        var tdanmu = ldanmu[0];
        ldanmu[0] = ldanmu[0].slice(5)
        tdanmu = ldanmu[ldanmu.length - 1];
        ldanmu[ldanmu.length - 1] = tdanmu.slice(0, tdanmu.length - 4);
        for (var i = 0; i < ldanmu.length; i++) {
            var danmu = ldanmu[i]
            var pos = danmu.indexOf('>')
            var argv = danmu.substring(1, pos - 1).split(',')
            ldanmu[i] = {
                color: Number(argv[3]),
                content: xmlunEscape(danmu.slice(pos + 1)),
                ctime: Number(argv[4]),
                fontsize: Number(argv[2]),
                id: Number(argv[5]),
                idStr: argv[5],
                midHash: 'niconico',
                mode: Number(argv[1]),
                progress: Math.round(Number(argv[0]) * 1000),
                weight: 10
            }
        }
        return ldanmu
    } else {
        ldanmu = sdanmu.split('\n')
        for (var i = 0; i < ldanmu.length; i++) {
            var danmu = ldanmu[i]
            var pos = danmu.indexOf('""')
            var argv = danmu.slice(0, pos).split(',')
            var content = JSON.parse('"' + danmu.slice(pos + 2) + '"')
            var [progress, ctime, lcommand] = argv
            var danmuType = 1
            var fontSize = 25
            var color = 0xffffff
            if (len(lcommand) > 0) {
                lcommand = lcommand.slice(1, len(lcommand) - 1).split(',')
                for (var command of lcommand) {
                    if (command === 'ue')
                        danmuType = 5
                    else if (command === 'shita')
                        danmuType = 4
                    else if (command === 'big')
                        fontSize = 30
                    else if (command === 'small')
                        fontSize = 20
                    else if (dColor.hasOwnProperty(command))
                        color = dColor[command]
                    else if (command[0] === '#')
                        try {
                            color = parseInt(command.slice(1), 16)
                        } catch (e) {
                        }
                    else if (command === 'naka' || command === 'white' || command === '184' || command === 'medium'
                        || command === 'middle' || command === 'docomo' || command.startsWith('device')) {
                    } else {
                        console.log('Unknown mail', command)
                    }
                }
            }
            ldanmu[i] = {
                color: color,
                content: content,
                ctime: ctime,
                fontsize: fontSize,
                id: i + startIndex,
                idStr: str(i + startIndex),
                midHash: 'niconico',
                mode: danmuType,
                progress: progress * 10,
                weight: 10
            }
        }
    }
}

var hasProxy = false

function nicoDanmu(nicoid) {
    if (hasProxy === false || nicoid.startsWith('so')) {
        console.log('Found NicoID:' + nicoid)
        var nicodanmu = http.get('https://delflare505.win:800/nico/?nicoid=' + nicoid).body.string()
        if (nicodanmu === null) {
            return []
        }
        var ldanmu = parseNicoResponse(nicodanmu)
        if (setting.translateNicoComment) {
            ldanmu = translateNico(ldanmu)
        }
        if (setting.replaceKatakana) {
            ldanmu = replaceKatakana((ldanmu))
        }
        console.log('ndanmu:' + ldanmu.length + ' from niconico')
        return ldanmu
    } else {
        var url = 'https://comment.bilibili.com/70870.xml'
        url = 'https://www.nicovideo.jp/watch/' + nicoid
        var page = http.get(url).body.string()
        var apiData = /<div id="js-initial-watch-data".*?hidden><\/div>/.exec(page)
        apiData = apiData[0]
        var htmlObject = document.createElement('div');
        htmlObject.innerHTML = apiData;
        htmlObject = htmlObject.firstChild;
        var info = JSON.parse(htmlObject.getAttribute('data-api-data'))
        var duration = info['video']['duration']
        var lthread
        if (info.hasOwnProperty('commentComposite')) {
            lthread = info['commentComposite']['threads']
        } else {
            lthread = info['comment']['threads']
        }
        var body = genNicoAPIBody(lthread, duration)
        var comment = http.postJson(
            'http://nmsg.nicovideo.jp/api.json/', body
        ).body.json()

        var res = []
        for (var i = 0; i < comment.length; i++) {
            var c = comment[i]
            if (c.hasOwnProperty('chat')) {
                res.push(c['chat'])
            }
        }
        var ldanmu = []
        var lcolorCommand =
            ['red', 'pink', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'black',
                'niconicowhite', 'white2', 'truered', 'red2', 'pink2', 'passionorange', 'orange2',
                'madyellow', 'yellow2', 'elementalgreen', 'green2', 'cyan2', 'marineblue', 'blue2',
                'nobleviovar', 'purple2', 'black2']
        var lcolor = [0xFF0000, 0xFF8080, 0xFFCC00, 0xFFFF00, 0x00FF00, 0x00FFFF, 0x0000FF, 0xC000FF, 0x000000,
            0xCCCC99, 0xCCCC99, 0xCC0033, 0xCC0033, 0xFF33CC, 0xFF6600, 0xFF6600,
            0x999900, 0x999900, 0x00CC66, 0x00CC66, 0x00CCCC, 0x3399FF, 0x3399FF,
            0x6633CC, 0x6633CC, 0x666666]
        var noPool = []
        for (var i = 0; i < res.length; i++) {
            var danmu = res[i]
            if (noPool.indexOf(danmu['no']) === -1) {
                noPool.push(danmu['no'])
            } else {
                continue
            }
            if (danmu.hasOwnProperty('devared'))
                continue
            var danmuType = 1
            var fontSize = 25
            var color = 0xffffff
            if (danmu.hasOwnProperty('mail')) {
                var lcommand = danmu['mail'].split(' ')
                for (var command of lcommand) {
                    if (command === 'ue')
                        danmuType = 5
                    else if (command === 'shita')
                        danmuType = 4
                    else if (command === 'big')
                        fontSize = 30
                    else if (command === 'small')
                        fontSize = 20
                    else if (lcolorCommand.indexOf(command) !== -1)
                        color = lcolor[lcolorCommand.indexOf(command)]
                    else if (command[0] === '#')
                        color = parseInt(command.slice(1), 16)
                    else if (command === 'naka' || command === 'white' || command === '184' || command === 'medium'
                        || command === 'middle' || command === 'docomo' || command.startsWith('device')) {
                    } else {
                        console.log('Unknown mail', command)
                    }
                }
            }
            ldanmu.push({
                color: color,
                content: danmu['content'],
                ctime: danmu['date'],
                fontsize: fontSize,
                id: Number(danmu['no']),
                idStr: str(danmu['no']),
                midHash: 'niconico',
                mode: danmuType,
                progress: danmu["vpos"] * 10,
                weight: 10
            })
        }
        if (window.setting.translateNicoComment) {
            ldanmu = translateNico(ldanmu)
        }
        return ldanmu
    }
}

var md5 = function () {
    'use strict'

    /**
     * Add integers, wrapping at 2^32.
     * This uses 16-bit operations internally to work around bugs in interpreters.
     *
     * @param {number} x First integer
     * @param {number} y Second integer
     * @returns {number} Sum
     */
    function safeAdd(x, y) {
        var lsw = (x & 0xffff) + (y & 0xffff)
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
        return (msw << 16) | (lsw & 0xffff)
    }

    /**
     * Bitwise rotate a 32-bit number to the left.
     *
     * @param {number} num 32-bit number
     * @param {number} cnt Rotation count
     * @returns {number} Rotated number
     */
    function bitRotateLeft(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt))
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} q q
     * @param {number} a a
     * @param {number} b b
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5cmn(q, a, b, x, s, t) {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5ff(a, b, c, d, x, s, t) {
        return md5cmn((b & c) | (~b & d), a, b, x, s, t)
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5gg(a, b, c, d, x, s, t) {
        return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5hh(a, b, c, d, x, s, t) {
        return md5cmn(b ^ c ^ d, a, b, x, s, t)
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5ii(a, b, c, d, x, s, t) {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t)
    }

    /**
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     *
     * @param {Array} x Array of little-endian words
     * @param {number} len Bit length
     * @returns {Array<number>} MD5 Array
     */
    function binlMD5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << len % 32
        x[(((len + 64) >>> 9) << 4) + 14] = len

        var i
        var olda
        var oldb
        var oldc
        var oldd
        var a = 1732584193
        var b = -271733879
        var c = -1732584194
        var d = 271733878

        for (i = 0; i < x.length; i += 16) {
            olda = a
            oldb = b
            oldc = c
            oldd = d

            a = md5ff(a, b, c, d, x[i], 7, -680876936)
            d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
            c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
            b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
            a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
            d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
            c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
            b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
            a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
            d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
            c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
            b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
            a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
            d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
            c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
            b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

            a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
            d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
            c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
            b = md5gg(b, c, d, a, x[i], 20, -373897302)
            a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
            d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
            c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
            b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
            a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
            d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
            c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
            b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
            a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
            d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
            c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
            b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

            a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
            d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
            c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
            b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
            a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
            d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
            c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
            b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
            a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
            d = md5hh(d, a, b, c, x[i], 11, -358537222)
            c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
            b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
            a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
            d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
            c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
            b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

            a = md5ii(a, b, c, d, x[i], 6, -198630844)
            d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
            c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
            b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
            a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
            d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
            c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
            b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
            a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
            d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
            c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
            b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
            a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
            d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
            c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
            b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

            a = safeAdd(a, olda)
            b = safeAdd(b, oldb)
            c = safeAdd(c, oldc)
            d = safeAdd(d, oldd)
        }
        return [a, b, c, d]
    }

    /**
     * Convert an array of little-endian words to a string
     *
     * @param {Array<number>} input MD5 Array
     * @returns {string} MD5 string
     */
    function binl2rstr(input) {
        var i
        var output = ''
        var length32 = input.length * 32
        for (i = 0; i < length32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
        }
        return output
    }

    /**
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     *
     * @param {string} input Raw input string
     * @returns {Array<number>} Array of little-endian words
     */
    function rstr2binl(input) {
        var i
        var output = []
        output[(input.length >> 2) - 1] = undefined
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0
        }
        var length8 = input.length * 8
        for (i = 0; i < length8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32
        }
        return output
    }

    /**
     * Calculate the MD5 of a raw string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rstrMD5(s) {
        return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
    }

    /**
     * Calculates the HMAC-MD5 of a key and some data (raw strings)
     *
     * @param {string} key HMAC key
     * @param {string} data Raw input string
     * @returns {string} Raw MD5 string
     */
    function rstrHMACMD5(key, data) {
        var i
        var bkey = rstr2binl(key)
        var ipad = []
        var opad = []
        var hash
        ipad[15] = opad[15] = undefined
        if (bkey.length > 16) {
            bkey = binlMD5(bkey, key.length * 8)
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636
            opad[i] = bkey[i] ^ 0x5c5c5c5c
        }
        hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
        return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
    }

    /**
     * Convert a raw string to a hex string
     *
     * @param {string} input Raw input string
     * @returns {string} Hex encoded string
     */
    function rstr2hex(input) {
        var hexTab = '0123456789abcdef'
        var output = ''
        var x
        var i
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i)
            output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
        }
        return output
    }

    /**
     * Encode a string as UTF-8
     *
     * @param {string} input Input string
     * @returns {string} UTF8 string
     */
    function str2rstrUTF8(input) {
        return unescape(encodeURIComponent(input))
    }

    /**
     * Encodes input string as raw MD5 string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rawMD5(s) {
        return rstrMD5(str2rstrUTF8(s))
    }

    /**
     * Encodes input string as Hex encoded string
     *
     * @param {string} s Input string
     * @returns {string} Hex encoded string
     */
    function hexMD5(s) {
        return rstr2hex(rawMD5(s))
    }

    /**
     * Calculates the raw HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function rawHMACMD5(k, d) {
        return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
    }

    /**
     * Calculates the Hex encoded HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function hexHMACMD5(k, d) {
        return rstr2hex(rawHMACMD5(k, d))
    }

    /**
     * Calculates MD5 value for a given string.
     * If a key is provided, calculates the HMAC-MD5 value.
     * Returns a Hex encoded string unless the raw argument is given.
     *
     * @param {string} string Input string
     * @param {string} [key] HMAC key
     * @param {boolean} [raw] Raw output switch
     * @returns {string} MD5 output
     */
    function md5(string, key, raw) {
        if (!key) {
            if (!raw) {
                return hexMD5(string)
            }
            return rawMD5(string)
        }
        if (!raw) {
            return hexHMACMD5(key, string)
        }
        return rawHMACMD5(key, string)
    }

    return md5
}


function findAll(reg, text) {
    var res = [], match
    while (match = reg.exec(text)) {
        res.push(match[1])
    }
    return res
}

function translateBaidu(query) {

    var appid = '20190602000304141';
    var key = 'BHZLmfgU_oxXsyDZ2SEi';
    var salt = '000000';
// 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
    var from = 'auto';
    var to = 'zh';
    var str1 = appid + query + salt + key;
    var sign = md5(str1);
    var data = {
        q: query,
        appid: appid,
        salt: salt,
        from: from,
        to: to,
        sign: sign
    }
    var result = http.post(
        'http://api.fanyi.baidu.com/api/trans/vip/translate',
        data).body.json()
    if (!result.hasOwnProperty('trans_result')) {
        console.log('translate failed', result)
        throw Error
    }
    return result
}


function katakana(danmu) {
    var ddkata = {
        'ウィ': 'wi', 'ウェ': 'we', 'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo', 'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
        'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho', 'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo', 'チャ': 'cha', 'チュ': 'chu',
        'チョ': 'cho', 'ヂャ': 'dha', 'ヂュ': 'dhu', 'ヂョ': 'dho', 'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo', 'ヒャ': 'hya',
        'ヒュ': 'hyu', 'ヒョ': 'hyo', 'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo', 'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
        'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo', 'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo', 'ヴャ': 'vya', 'ヴュ': 'vyu',
        'ヴョ': 'vyo',
    }
    var dskata = {
        'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o', 'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke',
        'コ': 'ko', 'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so', 'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu',
        'テ': 'te', 'ト': 'to', 'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no', 'ハ': 'ha', 'ヒ': 'hi',
        'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho', 'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo', 'ヤ': 'ya',
        'ユ': 'yu', 'ェ': 'e', 'ヨ': 'yo', 'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro', 'ワ': 'wa',
        'ヲ': 'wo', 'ン': 'n', 'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go', 'ザ': 'za', 'ジ': 'ji',
        'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo', 'ダ': 'da', 'ヂ': 'dji', 'ヅ': 'dzu', 'デ': 'de', 'ド': 'do', 'バ': 'ba',
        'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo', 'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po'
    }
    var tdanmu = []
    var ichar = -1
    while (ichar < len(danmu) - 1) {
        ichar += 1
        var char = danmu[ichar]
        var word = danmu.slice(ichar, ichar + 2)
        if (ddkata.hasOwnProperty(word)) {
            tdanmu.push(ddkata[word])
            ichar += 1
            continue
        }
        if (char === 'っ' || char === 'ッ') {
            try {
                var nextChar = danmu[ichar + 1]
                if (dskata.hasOwnProperty(nextChar))
                    tdanmu.append(nextChar[word][0] + nextChar[word])
                ichar += 1
                continue
            } catch (e) {
            }
        }
        if (dskata.hasOwnProperty(char)) {
            tdanmu.push(dskata[char])
            continue
        }
        tdanmu.push(char)
    }
    return tdanmu.join('')

}

function replaceKatakana(ldanmu) {
    for (var idanmu = 0; idanmu < ldanmu.length; idanmu++) {
        ldanmu[idanmu].content = katakana(ldanmu[idanmu].content)
    }
    return ldanmu
}

function translateNico(ldanmu) {
    var ltrans = []
    var lid = []
    for (var idanmu = 0; idanmu < ldanmu.length; idanmu++) {
        var danmu = ldanmu[idanmu]
        var content = danmu.content
        if (content.indexOf('\n') !== -1) continue
        if (len(content) < 7) continue
        danmu.content = danmu.content.replace(/(.{1,3})\1{2,}$/, '$1$1')
        if (len(content) > 7) {
            ltrans.push(content)
            lid.push(danmu.id)
        } else {
            ldanmu[idanmu].content = katakana(content)
        }
    }
    var query = '\n'.join(ltrans)
    var lresult = []
    while (len(query) > 2000) {
        var pos = query.lastIndexOf('\n', 2000)
        var part = query.slice(0, pos)
        var res = translateBaidu(part)
        var t = sleep(1000)
        window.tempTran = part
        for (var i = 0; i < res['trans_result'].length; i++) {
            lresult.push(res['trans_result'][i]['dst'])
        }
        query = query.slice(pos + 1)
    }
    if (len(query) !== 0) {
        var t = sleep(1000)
        var res = translateBaidu(query)
        for (var i = 0; i < res['trans_result'].length; i++) {
            lresult.push(res['trans_result'][i]['dst'])
        }
    }
    var tlres = []
    for (var res of lresult) {
        if (res.indexOf('\n') !== -1) {
            tlres.concat(res.split('\n'))
        } else {
            tlres.push(res)
        }
    }
    ltrans = tlres
    var itrans = 0
    for (var idanmu = 0; idanmu < ldanmu.length; idanmu++) {
        var danmu = ldanmu[idanmu]

        if (danmu.id === lid[itrans]) {
            danmu.content = ltrans[itrans]
            itrans += 1
            // if (itrans > len(lid) - 1) {
            //     if(! ltrans[itrans]){
            //         throw 'transNumMismatchError'
            //     }
            //     break
            // }
        }
    }

    // console.log(ldanmu)
    return ldanmu
}


function format(text, dict) {
    var result = text
    var lkey = text.match(/{(.*?)}/g)
    for (var i = 0; i < lkey.length; i++) {
        var key = lkey[i]
        result = result.replace(key, dict[key.slice(1, -1)])
    }
    return result
}

function len(object) {
    return object.length
}

function str(object) {
    return object.toString()
}

function subtitle(aid, cid) {
    var content, danmu, duration, ldanmu, playerInfo, res, subtitleUrl;

    playerInfo = http.get(format('https://api.bilibili.com/x/player/v2?aid={aid}&cid={cid}', {
        aid: aid.toString(),
        cid: cid.toString()
    })).body.json();
    try {
        subtitleUrl = playerInfo["data"]["subtitle"]["subtitles"][0]["subtitle_url"];
    } catch (e) {
        return [];
    }
    res = http.get(("http:" + subtitleUrl)).body.json();
    ldanmu = [];
    var dis = 0.05
    for (var sub, _pj_c = 0, _pj_a = res["body"], _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        sub = _pj_a[_pj_c];
        duration = (sub["to"] - sub["from"]);

        var lpart = sub['content'].split('\n')
        var pos = 0.9 - dis * len(lpart)
        for (var part of lpart) {

            pos += dis
            content = format('["0.1","{pos}","0.8-1","{duration}","{content}",0,0,"0.1","{pos}","600","10",1,"NSimSun",1]',
                {
                    pos: pos,
                    duration: duration.toFixed(2),
                    content: part
                }
            );


            danmu = ('<d p="' + sub["from"] + ',7,25,16777215,0,1,subtitle,0">' + content + "</d>");
            ldanmu.push(danmu);
        }
    }
    return ldanmu;
}

function dmFengDanmaku(sn, startIndex) {
    var sdanmu = http.post('https://ani.gamer.com.tw/ajax/danmuGet.php', {'sn': parseInt(sn)}).body.json()
    var sizeDict = {
        1: 25,
        2: 36,
        0: 20
    }
    var positionDict = {
        0: 1,
        1: 4,
        2: 5
    }
    var ldanmu = []
    var count = startIndex
    for (var danmu of sdanmu) {
        if (!danmu["text"]) continue
        count += 1
        ldanmu.push(
            {
                color: parseInt(danmu['color'].slice(1), 16),
                content: danmu["text"],
                ctime: 1,
                fontsize: sizeDict[danmu["size"]],
                id: count,
                idStr: count.toString(),
                midHash: 'bahamute',
                mode: positionDict[danmu["position"]],
                progress: Math.round(danmu["time"] * 100),
                weight: 10
            }
        )
    }
    return ldanmu
}

var outsideFliter = JSON.parse('"\u8fbd\u5b81|\u5409\u6797|\u9ed1\u9f99\u6c5f|\u6cb3\u5317|\u5c71\u897f|\u9655\u897f|\u7518\u8083|\u9752\u6d77|\u5c71\u4e1c|\u5b89\u5fbd|\u6c5f\u82cf|\u6d59\u6c5f|\u6cb3\u5357|\u6e56\u5317|\u6e56\u5357|\u6c5f\u897f|\u53f0\u6e7e|\u798f\u5efa|\u4e91\u5357|\u6d77\u5357|\u56db\u5ddd|\u8d35\u5dde|\u5e7f\u4e1c|\u5185\u8499\u53e4|\u65b0\u7586|\u5e7f\u897f|\u897f\u85cf|\u5b81\u590f|\u5317\u4eac|\u4e0a\u6d77|\u5929\u6d25|\u91cd\u5e86|\u9999\u6e2f|\u6fb3\u95e8|\u6df1\u5733|\u5e7f\u5dde|\u6210\u90fd|\u907c\u5be7|\u5409\u6797|\u9ed1\u9f8d\u6c5f|\u6cb3\u5317|\u5c71\u897f|\u965c\u897f|\u7518\u8085|\u9752\u6d77|\u5c71\u6771|\u5b89\u5fbd|\u6c5f\u8607|\u6d59\u6c5f|\u6cb3\u5357|\u6e56\u5317|\u6e56\u5357|\u6c5f\u897f|\u81fa\u7063|\u798f\u5efa|\u96f2\u5357|\u6d77\u5357|\u56db\u5ddd|\u8cb4\u5dde|\u5ee3\u6771|\u5167\u8499\u53e4|\u65b0\u7586|\u5ee3\u897f|\u897f\u85cf|\u5be7\u590f|\u5317\u4eac|\u4e0a\u6d77|\u5929\u6d25|\u91cd\u6176|\u9999\u6e2f|\u6fb3\u9580|\u6df1\u5733|\u5ee3\u5dde|\u6210\u90fd|\u9080\u8bf7\u7801|\u667a\u969c|\u98ce\u4e91|fengyun|\\\\.inf|KK44K|\u8d64\u58c1|\u54c8\u65e5|1819se|\u652f\u4ed8\u5b9d|alipay|\u517c\u804c|\u6700\u597d\u7684|\u8fd1\u5e73|\u4f1a\u6240|\u65e5\u72d7|\u65e5\u8d3c|\u9ed1\u6728\u8033|ktv08|\\\\.com|shabi|shabi|SHABI|ShaBi|nimabi|NIMABI|nima|CNM|CTM|caotama|CAOTAMA|\u64cd\u4ed6\u5988|UPshabi|UP\u50bb\u903c|\u5783\u573e|laji|\u4ec0\u4e48\u73a9\u610f|shabi|TMD|\u5403\u5c4e|ed2k|QQ\u7fa4|\u6263\u6263\u7fa4|\u798f\u5229\u7f51|\\\\.tk|\u9a6c\u8001\u5e08|Q\u7fa4|\u50bb\u903c|\u5fcd\u8005\u5802|\u4e1c\u4eac\u5965|\u50bbb|\u59dc\u6c0f\u96c6\u56e2|\u062f\u0631\u062f\u0634|http|\u53f0\u7063|\u81fa\u7063|\u0627\u0644\u064a\u0648\u0645!|\u0627\u0635\u062f\u0642\u0627\u0621|\u0633\u062c\u0644|\u0644\u0643\u062b\u064a\u0631|\u0643|\u50bb\u903c|\u50bbB|\u516b\u4e5d|\u516d\u56db|\u64cd\u4f60\u5988|\u767e\u6770|\u65e5\u672c\u662f\u4e2d\u56fd|\u5171\u4ea7\u515a|\u5171\u532a|\u652f\u90a3|\u53f0\u5df4\u5b50|sb|\u5e72\u4f60|\u9e21\u5df4|\u808f|\u6dd8\u5b9d|uid|\u529e\u8bc1|\u5ea6\u641c|\u5c3c\u739b|tao|\\\\.com|\\\\.cc|\\\\.us|\u6cd5\u8f6e|\u8349\u69b4|\u6700\u65b0\u5730\u5740|\\\\.tk|2b|2B|elove|\u0e2a\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47|\u9080\u8acb\u78bc|\u667a\u969c|\u98a8\u96f2|fengyun|\\\\.inf|KK44K|\u8d64\u58c1|\u54c8\u65e5|1819se|\u652f\u4ed8\u5bf6|alipay|\u517c\u8077|\u6700\u597d\u7684|\u8fd1\u5e73|\u6703\u6240|\u65e5\u72d7|\u65e5\u8cca|\u9ed1\u6728\u8033|ktv08|\\\\.com|shabi|shabi|SHABI|ShaBi|nimabi|NIMABI|nima|CNM|CTM|caotama|CAOTAMA|\u64cd\u4ed6\u5abd|UPshabi|UP\u50bb\u903c|\u5783\u573e|laji|\u4ec0\u9ebd\u73a9\u610f|shabi|TMD|\u5403\u5c4e|ed2k|QQ\u7fa4|\u6263\u6263\u7fa4|\u798f\u5229\u7db2|\\\\.tk|\u99ac\u8001\u5e2b|Q\u7fa4|\u50bb\u903c|\u5fcd\u8005\u5802|\u6771\u4eac\u5967|\u50bbb|\u59dc\u6c0f\u96c6\u5718|\u062f\u0631\u062f\u0634|http|\u81fa\u7063|\u81fa\u7063|\u0627\u0644\u064a\u0648\u0645!|\u0627\u0635\u062f\u0642\u0627\u0621|\u0633\u062c\u0644|\u0644\u0643\u062b\u064a\u0631|\u0643|\u50bb\u903c|\u50bbB|\u516b\u4e5d|\u516d\u56db|\u64cd\u4f60\u5abd|\u767e\u5091|\u65e5\u672c\u662f\u4e2d\u570b|\u5171\u7522\u9ee8|\u5171\u532a|\u652f\u90a3|\u81fa\u5df4\u5b50|sb|\u5e79\u4f60|\u96de\u5df4|\u808f|\u6dd8\u5bf6|uid|\u8fa6\u8b49|\u5ea6\u641c|\u5c3c\u746a|tao|\\\\.com|\\\\.cc|\\\\.us|\u6cd5\u8f2a|\u8349\u69b4|\u6700\u65b0\u5730\u5740|\\\\.tk|2b|2B|elove|\u0e2a\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47|\u4e60\u8fd1\u5e73|\u5e73\u8fd1\u4e60|xjp|\u4e60\u592a\u5b50|\u4e60\u660e\u6cfd|\u8001\u4e60|\u6e29\u5bb6\u5b9d|\u6e29\u52a0\u5b9d|\u6e29x|\u6e29jia\u5b9d|\u6e29\u5b9d\u5b9d|\u6e29\u52a0\u9971|\u6e29\u52a0\u4fdd|\u5f20\u57f9\u8389|\u6e29\u4e91\u677e|\u6e29\u5982\u6625|\u6e29jb|\u80e1\u6e29|\u80e1x|\u80e1jt|\u80e1boss|\u80e1\u603b|\u80e1\u738b\u516b|hujintao|\u80e1jintao|\u80e1j\u6d9b|\u80e1\u60ca\u6d9b|\u80e1\u666f\u6d9b|\u80e1\u7d27\u638f|\u6e56\u7d27\u638f|\u80e1\u7d27\u5957|\u9526\u6d9b|hjt|\u80e1\u6d3e|\u80e1\u4e3b\u5e2d|\u5218\u6c38\u6e05|\u80e1\u6d77\u5cf0|\u80e1\u6d77\u6e05|\u6c5f\u6cfd\u6c11|\u6c11\u6cfd\u6c5f|\u6c5f\u80e1|\u6c5f\u54e5|\u6c5f\u4e3b\u5e2d|\u6c5f\u4e66\u8bb0|\u6c5f\u6d59\u95fd|\u6c5f\u6ca2\u6c11|\u6c5f\u6d59\u6c11|\u62e9\u6c11|\u5219\u6c11|\u8333\u6cfd\u6c11|zemin|ze\u6c11|\u8001\u6c5f|\u8001j|\u6c5fcore|\u6c5fx|\u6c5f\u6d3e|\u6c5fzm|jzm|\u6c5f\u620f\u5b50|\u6c5f\u86e4\u87c6|\u6c5f\u67d0\u67d0|\u6c5f\u8d3c|\u6c5f\u732a|\u6c5f\u6c0f\u96c6\u56e2|\u6c5f\u7ef5\u6052|\u6c5f\u7ef5\u5eb7|\u738b\u51b6\u576a|\u6c5f\u6cfd\u6167|\u9093\u5c0f\u5e73|\u5e73\u5c0f\u9093|xiao\u5e73|\u9093xp|\u9093\u6653\u5e73|\u9093\u6734\u65b9|\u9093\u6995|\u9093\u8d28\u65b9|\u6bdb\u6cfd\u4e1c|\u732b\u6cfd\u4e1c|\u732b\u5219\u4e1c|\u732b\u8d3c\u6d1e|\u6bdbzd|\u6bdbzx|z\u4e1c|ze\u4e1c|\u6cfdd|zedong|\u6bdb\u592a\u7956|\u6bdb\u76f8|\u4e3b\u5e2d\u753b\u50cf|\u6539\u9769\u5386\u7a0b|\u6731\u9555\u57fa|\u6731\u5bb9\u57fa|\u6731\u9555\u9e21|\u6731\u5bb9\u9e21|\u6731\u4e91\u6765|\u674e\u9e4f|\u674epeng|\u91cc\u9e4f|\u674e\u6708\u6708\u9e1f|\u674e\u5c0f\u9e4f|\u674e\u5c0f\u7433|\u534e\u4e3b\u5e2d|\u534e\u56fd|\u56fd\u950b|\u56fd\u5cf0|\u950b\u540c\u5fd7|\u767d\u6625\u793c|\u8584\u7199\u6765|\u8584\u4e00\u6ce2|\u8521\u8d74\u671d|\u8521\u6b66|\u66f9\u521a\u5ddd|\u5e38\u4e07\u5168|\u9648\u70b3\u5fb7|\u9648\u5fb7\u94ed|\u9648\u5efa\u56fd|\u9648\u826f\u5b87|\u9648\u7ecd\u57fa|\u9648\u540c\u6d77|\u9648\u81f3\u7acb|\u6234\u79c9\u56fd|\u4e01\u4e00\u5e73|\u8463\u5efa\u534e|\u675c\u5fb7\u5370|\u675c\u4e16\u6210|\u5085\u9510|\u90ed\u4f2f\u96c4|\u90ed\u91d1\u9f99|\u8d3a\u56fd\u5f3a|\u80e1\u6625\u534e|\u8000\u90a6|\u534e\u5efa\u654f|\u9ec4\u534e\u534e|\u9ec4\u4e3d\u6ee1|\u9ec4\u5174\u56fd|\u56de\u826f\u7389|\u8d3e\u5e86\u6797|\u8d3e\u5ef7\u5b89|\u9756\u5fd7\u8fdc|\u674e\u957f\u6625|\u674e\u6625\u57ce|\u674e\u5efa\u56fd|\u674e\u514b\u5f3a|\u674e\u5c9a\u6e05|\u674e\u6c9b\u7476|\u674e\u8363\u878d|\u674e\u745e\u73af|\u674e\u94c1\u6620|\u674e\u5148\u5ff5|\u674e\u5b66\u4e3e|\u674e\u6e90\u6f6e|\u6817\u667a|\u6881\u5149\u70c8|\u5ed6\u9521\u9f99|\u6797\u6811\u68ee|\u6797\u708e\u5fd7|\u6797\u5de6\u9e23|\u4ee4\u8ba1\u5212|\u67f3\u658c\u6770|\u5218\u5947\u8446|\u5218\u5c11\u5947|\u5218\u5ef6\u4e1c|\u5218\u4e91\u5c71|\u5218\u5fd7\u519b|\u9f99\u65b0\u6c11|\u8def\u752c\u7965|\u7f57\u7bad|\u5415\u7956\u5584|\u9a6c\u98da|\u9a6c\u607a|\u5b5f\u5efa\u67f1|\u6b27\u5e7f\u6e90|\u5f3a\u536b|\u6c88\u8dc3\u8dc3|\u5b8b\u5e73\u987a|\u7c9f\u620e\u751f|\u82cf\u6811\u6797|\u5b59\u5bb6\u6b63|\u94c1\u51dd|\u5c60\u5149\u7ecd|\u738b\u4e1c\u660e|\u6c6a\u4e1c\u5174|\u738b\u9e3f\u4e3e|\u738b\u6caa\u5b81|\u738b\u4e50\u6cc9|\u738b\u6d1b\u6797|\u738b\u5c90\u5c71|\u738b\u80dc\u4fca|\u738b\u592a\u534e|\u738b\u5b66\u519b|\u738b\u5146\u56fd|\u738b\u632f\u534e|\u5434\u90a6\u56fd|\u5434\u5b9a\u5bcc|\u5434\u5b98\u6b63|\u65e0\u5b98\u6b63|\u5434\u80dc\u5229|\u5434\u4eea|\u595a\u56fd\u534e|\u4e60\u4ef2\u52cb|\u5f90\u624d\u539a|\u8bb8\u5176\u4eae|\u5f90\u7ecd\u53f2|\u6768\u6d01\u7bea|\u53f6\u5251\u82f1|\u7531\u559c\u8d35|\u4e8e\u5e7c\u519b|\u4fde\u6b63\u58f0|\u8881\u7eaf\u6e05|\u66fe\u57f9\u708e|\u66fe\u5e86\u7ea2|\u66fe\u5baa\u6893|\u66fe\u836b\u6743|\u5f20\u5fb7\u6c5f|\u5f20\u5b9a\u53d1|\u5f20\u9ad8\u4e3d|\u5f20\u7acb\u660c|\u5f20\u8363\u5764|\u5f20\u5fd7\u56fd|\u8d75\u6d2a\u795d|\u7d2b\u9633|\u5468\u751f\u8d24|\u5468\u6c38\u5eb7|\u6731\u6d77\u4ed1|\u4e2d\u5357\u6d77|\u5927\u9646\u5f53\u5c40|\u4e2d\u56fd\u5f53\u5c40|\u5317\u4eac\u5f53\u5c40|\u5171\u4ea7\u515a|\u515a\u4ea7\u5171|\u5171\u8d2a\u515a|\u963f\u5171|\u4ea7\u515a\u5171|\u516c\u4ea7\u515a|\u5de5\u4ea7\u515a|\u5171c\u515a|\u5171x\u515a|\u5171\u94f2|\u4f9b\u4ea7|\u5171\u60e8|\u4f9b\u94f2\u515a|\u4f9b\u94f2\u8c20|\u4f9b\u94f2\u88c6|\u5171\u6b8b\u515a|\u5171\u6b8b\u4e3b\u4e49|\u5171\u4ea7\u4e3b\u4e49\u7684\u5e7d\u7075|\u62f1\u94f2|\u8001\u5171|\u4e2d\u5171|\u4e2d\u73d9|\u4e2dgong|gc\u515a|\u8d21\u6321|gong\u515a|g\u4ea7|\u72d7\u4ea7\u86cb|\u5171\u6b8b\u88c6|\u6076\u515a|\u90aa\u515a|\u5171\u4ea7\u4e13\u5236|\u5171\u4ea7\u738b\u671d|\u88c6\u4e2d\u592e|\u571f\u5171|\u571fg|\u5171\u72d7|g\u532a|\u5171\u532a|\u4ec7\u5171|\u653f\u5e9c|\u75c7\u8150|\u653f\u8150|\u653f\u4ed8|\u6b63\u5e9c|\u653f\u4fef|\u653ff|zhengfu|\u653fzhi|\u6321\u4e2d\u592e|\u6863\u4e2d\u592e|\u4e2d\u592e\u9886\u5bfc|\u4e2d\u56fdzf|\u4e2d\u592ezf|\u56fdwu\u9662|\u4e2d\u534e\u5e1d\u56fd|gong\u548c|\u5927\u9646\u5b98\u65b9|\u5317\u4eac\u653f\u6743|\u6c5f\u6cfd\u6c11|\u80e1\u9526\u6d9b|\u6e29\u5bb6\u5b9d|\u4e60\u8fd1\u5e73|\u4e60\u4ef2\u52cb|\u8d3a\u56fd\u5f3a|\u8d3a\u5b50\u73cd|\u5468\u6c38\u5eb7|\u674e\u957f\u6625|\u674e\u5fb7\u751f|\u738b\u5c90\u5c71|\u59da\u4f9d\u6797|\u56de\u826f\u7389|\u674e\u6e90\u6f6e|\u674e\u5e72\u6210|\u6234\u79c9\u56fd|\u9ec4\u9547|\u5218\u5ef6\u4e1c|\u5218\u745e\u9f99|\u4fde\u6b63\u58f0|\u9ec4\u656c|\u8584\u7199|\u8584\u4e00\u6ce2|\u5468\u5c0f\u5ddd|\u5468\u5efa\u5357|\u6e29\u4e91\u677e|\u5f90\u660e|\u6c5f\u6cfd\u6167|\u6c5f\u7ef5\u6052|\u6c5f\u7ef5\u5eb7|\u674e\u5c0f\u9e4f|\u674e\u9e4f|\u674e\u5c0f\u7433|\u6731\u4e91\u6765|\u6731\u5bb9\u57fa|\u6cd5\u8f6e\u529f|\u674e\u6d2a\u5fd7|\u65b0\u7586\u9a9a\u4e71|\u4e60\u8fd1\u5e73|\u4e60\u4ef2\u52cb|\u5341\u4e5d\u5927\u4fee\u5baa|\u4e60\u8fd1\u5e73\u8fde\u4efb|\u5baa\u6cd5\u4fee\u6b63\u6848|\u4efb\u671f\u9650\u5236|\u8150\u8d25\u4e2d\u56fd|\u4e09\u4e2a\u4ee3\u8868|\u793e\u4f1a\u4e3b\u4e49\u706d\u4ea1|\u6253\u5012\u4e2d\u56fd|\u6253\u5012\u5171\u4ea7\u515a|\u6253\u5012\u5171\u4ea7\u4e3b\u4e49|\u6253\u5012\u80e1\u9526\u6d9b|\u6253\u5012\u6c5f\u6cfd\u6c11|\u6253\u5012\u6c5f\u4e3b\u5e2d|\u6253\u5012\u7f57\u5e72|\u6253\u5012\u4e2d\u5171|\u62b5\u5236\u5171\u4ea7\u515a|\u62b5\u5236\u5171\u4ea7\u4e3b\u4e49|\u62b5\u5236\u80e1\u9526\u6d9b|\u62b5\u5236\u6c5f\u6cfd\u6c11|\u62b5\u5236\u6c5f\u4e3b\u5e2d|\u62b5\u5236\u674e\u9e4f|\u62b5\u5236\u7f57\u5e72|\u62b5\u5236\u6e29\u5bb6\u5b9d|\u62b5\u5236\u4e2d\u5171|\u62b5\u5236\u6731\ufffdF\u57fa|\u706d\u4ea1\u4e2d\u56fd|\u4ea1\u515a\u4ea1\u56fd|\u7c89\u788e\u56db\u4eba\u5e2e|\u6fc0\u6d41\u4e2d\u56fd|\u7279\u4f9b|\u7279\u8d21|\u7279\u5171|zf\u5927\u697c|\u6b83\u89c6|\u8d2a\u6c61\u8150\u8d25|\u5f3a\u5236\u62c6\u9664|\u5f62\u5f0f\u4e3b\u4e49|\u653f\u6cbb\u98ce\u6ce2|\u592a\u5b50\u515a|\u4e0a\u6d77\u5e2e|\u5317\u4eac\u5e2e|\u6e05\u534e\u5e2e|\u7ea2\u8272\u8d35\u65cf|\u6743\u8d35\u96c6\u56e2|\u6cb3\u87f9\u793e\u4f1a|\u559d\u8840\u793e\u4f1a|\u4e5d\u98ce|9\u98ce|\u5341\u4e03\u5927|\u53417\u5927|17da|\u4e5d\u5b66|9\u5b66|\u56db\u98ce|4\u98ce|\u53cc\u89c4|\u5357\u8857\u6751|\u6700\u6deb\u5b98\u5458|\u8b66\u532a|\u5b98\u532a|\u72ec\u592b\u6c11\u8d3c|\u5b98\u5546\u52fe\u7ed3|\u57ce\u7ba1\u66b4\u529b\u6267\u6cd5|\u5f3a\u5236\u6350\u6b3e|\u6bd2\u8c7a|\u4e00\u515a\u6267\u653f|\u4e00\u515a\u4e13\u5236|\u4e00\u515a\u4e13\u653f|\u4e13\u5236\u653f\u6743|\u5baa\u6cd5\u6cd5\u9662|\u80e1\u5e73|\u82cf\u6653\u5eb7|\u8d3a\u536b\u65b9|\u8c2d\u4f5c\u4eba|\u7126\u56fd\u6807|\u4e07\u6da6\u5357|\u5f20\u5fd7\u65b0|\u9ad8\u52e4\u8363|\u738b\u70b3\u7ae0|\u9ad8\u667a\u665f|\u53f8\u9a6c\u7490|\u5218\u6653\u7af9|\u5218\u5bbe\u96c1|\u9b4f\u4eac\u751f|\u5bfb\u627e\u6797\u662d\u7684\u7075\u9b42|\u522b\u68a6\u6210\u7070|\u8c01\u662f\u65b0\u4e2d\u56fd|\u8ba8\u4f10\u4e2d\u5ba3\u90e8|\u5f02\u8bae\u4eba\u58eb|\u6c11\u8fd0\u4eba\u58eb|\u542f\u8499\u6d3e|\u9009\u56fd\u5bb6\u4e3b\u5e2d|\u6c11\u4e00\u4e3b|min\u4e3b|\u6c11\u7af9|\u6c11\u73e0|\u6c11\u732a|chinesedemocracy|\u5927\u8d66\u56fd\u9645|\u56fd\u9645\u7279\u8d66|da\u9009|\u6295\u516c|\u516c\u5934|\u5baa\u653f|\u5e73\u53cd|\u515a\u7ae0|\u7ef4\u6743|\u661d\u7231\u5b97|\u5baa\u7ae0|08\u5baa|08xz|\u62bf\u4e3b|\u654f\u4e3b|\u4eba\u62f3|\u4eba\u6728\u53c8|\u4ebaquan|renquan|\u4e2d\u56fd\u4eba\u6743|\u4e2d\u56fd\u65b0\u6c11\u515a|\u7fa4\u4f53\u4e8b\u4ef6|\u7fa4\u4f53\u6027\u4e8b\u4ef6|\u4e0a\u4e2d\u592e|\u53bb\u4e2d\u592e|\u8ba8\u8bf4\u6cd5|\u8bf7\u613f|\u8bf7\u547d|\u516c\u5f00\u4fe1|\u8054\u540d\u4e0a\u4e66|\u4e07\u4eba\u5927\u7b7e\u540d|\u4e07\u4eba\u9a9a\u52a8|\u622a\u8bbf|\u4e0a\u8bbf|shangfang|\u4fe1\u8bbf|\u8bbf\u6c11|\u96c6\u5408|\u96c6\u4f1a|\u7ec4\u7ec7\u96c6\u4f53|\u9759\u5750|\u9759zuo|jing\u5750|\u793a\u5a01|\u793awei|\u6e38\u884c|you\u884c|\u6cb9\u884c|\u6e38xing|youxing|\u5b98\u903c\u6c11\u53cd|\u53cdparty|\u53cd\u5171|\u6297\u8bae|\u4ea2\u8bae|\u62b5\u5236|\u4f4e\u5236|\u5e95\u5236|di\u5236|\u62b5zhi|dizhi|boycott|\u8840\u4e66|\u711a\u70e7\u4e2d\u56fd\u56fd\u65d7|baoluan|\u6d41\u8840\u51b2\u7a81|\u51fa\u73b0\u66b4\u52a8|\u53d1\u751f\u66b4\u52a8|\u5f15\u8d77\u66b4\u52a8|baodong|\u706d\u5171|\u6740\u6bd9|\u7f62\u5de5|\u9738\u5de5|\u7f62\u8003|\u7f62\u9910|\u9738\u9910|\u7f62\u53c2|\u7f62\u996d|\u7f62\u5403|\u7f62\u98df|\u7f62\u8bfe|\u7f62ke|\u9738\u8bfe|ba\u8bfe|\u7f62\u6559|\u7f62\u5b66|\u7f62\u8fd0|\u7f51\u7279|\u7f51\u8bc4\u5458|\u7f51\u7edc\u8bc4\u8bba\u5458|\u4e94\u6bdb\u515a|\u4e94\u6bdb\u4eec|5\u6bdb\u515a|\u6212\u4e25|jieyan|jie\u4e25|\u6212yan|8\u7684\u5e73\u65b9\u4e8b\u4ef6|\u77e5\u905364|\u516b\u4e5d\u5e74|\u8d30\u62fe\u5e74|2o\u5e74|20\u548c\u8c10\u5e74|\u8d30\u62fe\u5468\u5e74|\u516d\u56db|\u516d\u6cb3\u87f9\u56db|\u516d\u767e\u5ea6\u56db|\u516d\u548c\u8c10\u56db|\u9646\u56db|\u9646\u8086|198964|5\u670835|89\u5e74\u6625\u590f\u4e4b\u4ea4|64\u60e8\u6848|64\u65f6\u671f|64\u8fd0\u52a8|4\u4e8b\u4ef6|\u56db\u4e8b\u4ef6|\u5317\u4eac\u98ce\u6ce2|\u5b66\u6f6e|\u5b66chao|xuechao|\u5b66\u767e\u5ea6\u6f6e|\u95e8\u5b89\u5929|\u5929\u6309\u95e8|\u5766\u514b\u538b\u5927\u5b66\u751f|\u6c11\u4e3b\u5973\u795e|\u5386\u53f2\u7684\u4f24\u53e3|\u9ad8\u81ea\u8054|\u5317\u9ad8\u8054|\u8840\u6d17\u4eac\u57ce|\u56db\u4e8c\u516d\u793e\u8bba|\u738b\u4e39|\u67f4\u73b2|\u6c88\u5f64|\u5c01\u4ece\u5fb7|\u738b\u8d85\u534e|\u738b\u7ef4\u6797|\u543e\u5c14\u5f00\u5e0c|\u543e\u5c14\u5f00\u897f|\u4faf\u5fb7\u5065|\u960e\u660e\u590d|\u65b9\u52b1\u4e4b|\u848b\u6377\u8fde|\u4e01\u5b50\u9716|\u8f9b\u704f\u5e74|\u848b\u5f66\u6c38|\u4e25\u5bb6\u5176|\u9648\u4e00\u54a8|\u4e2d\u534e\u5c40\u57df\u7f51|\u515a\u7684\u5589\u820c|\u4e92\u8054\u7f51\u5ba1\u67e5|\u5f53\u5c40\u4e25\u5bc6\u5c01\u9501|\u65b0\u95fb\u5c01\u9501|\u5c01\u9501\u6d88\u606f|\u7231\u56fd\u8005\u540c\u76df|\u5173\u95ed\u6240\u6709\u8bba\u575b|\u7f51\u7edc\u5c01\u9501|\u91d1\u76fe\u5de5\u7a0b|gfw|\u65e0\u754c\u6d4f\u89c8|\u65e0\u754c\u7f51\u7edc|\u81ea\u7531\u95e8|\u4f55\u6e05\u6d9f|\u4e2d\u56fd\u7684\u9677\u9631|\u6c6a\u5146\u94a7|\u8bb0\u8005\u65e0\u7586\u754c|\u5883\u5916\u5a92\u4f53|\u7ef4\u57fa\u767e\u79d1|\u7ebd\u7ea6\u65f6\u62a5|bbc\u4e2d\u6587\u7f51|\u534e\u76db\u987f\u90ae\u62a5|\u4e16\u754c\u65e5\u62a5|\u4e1c\u68ee\u65b0\u95fb\u7f51|\u4e1c\u68ee\u7535\u89c6|\u661f\u5c9b\u65e5\u62a5|wikipedia|youtube|googleblogger|\u7f8e\u56fd\u5e7f\u64ad\u516c\u53f8|\u82f1\u56fd\u91d1\u878d\u65f6\u62a5|\u81ea\u7531\u4e9a\u6d32|\u81ea\u7531\u65f6\u62a5|\u4e2d\u56fd\u65f6\u62a5|\u53cd\u5206\u88c2|\u5a01\u80c1\u8bba|\u5de6\u7ffc\u8054\u76df|\u9493\u9c7c\u5c9b|\u4fdd\u9493\u7ec4\u7ec7|\u4e3b\u6743|\u5f13\u5355|\u706b\u4e4d|\u6728\u4ed3|\u77f3\u8096|\u6838\u86cb|\u6b65qiang|bao\u70b8|\u7206zha|baozha|zha\u836f|zha\u5f39|\u70b8dan|\u70b8yao|zhadan|zhayao|hmtd|\u4e09\u785d\u57fa\u7532\u82ef|\u516d\u6c1f\u5316\u94c0|\u70b8\u836f\u914d\u65b9|\u5f39\u836f\u914d\u65b9|\u70b8\u5f39\u914d\u65b9|\u76ae\u7bb1\u70b8\u5f39|\u706b\u836f\u914d\u65b9|\u4eba\u4f53\u70b8\u5f39|\u4eba\u8089\u70b8\u5f39|\u89e3\u653e\u519b|\u5175\u529b\u90e8\u7f72|\u519b\u8f6c|\u519b\u4e8b\u793e|8341\u90e8\u961f|\u7b2c21\u96c6\u56e2\u519b|\u4e03\u5927\u519b\u533a|7\u5927\u519b\u533a|\u5317\u4eac\u519b\u533a|\u6c88\u9633\u519b\u533a|\u6d4e\u5357\u519b\u533a|\u6210\u90fd\u519b\u533a|\u5e7f\u5dde\u519b\u533a|\u5357\u4eac\u519b\u533a|\u5170\u5dde\u519b\u533a|\u989c\u8272\u9769\u547d|\u89c4\u6a21\u51b2\u7a81|\u5854\u5229\u73ed|\u57fa\u5730\u7ec4\u7ec7|\u6050\u6016\u5206\u5b50|\u6050\u6016\u4efd\u5b50|\u4e09\u80a1\u52bf\u529b|\u5370\u5c3c\u5c60\u534e|\u5370\u5c3c\u4e8b\u4ef6|\u848b\u516c\u7eaa\u5ff5\u6b4c|\u9a6c\u82f1\u4e5d|mayingjiu|\u674e\u5929\u7fbd|\u82cf\u8d1e\u660c|\u6797\u6587\u6f2a|\u9648\u6c34\u6241|\u9648s\u6241|\u9648\u968f\u4fbf|\u963f\u6241|a\u6241|\u544a\u5168\u56fd\u540c\u80de\u4e66|\u53f0\u767e\u5ea6\u6e7e|\u53f0\u5b8c|\u53f0wan|taiwan|\u53f0\u5f2f|\u6e7e\u53f0|\u53f0\u6e7e\u56fd|\u53f0\u6e7e\u5171\u548c\u56fd|\u53f0\u519b|\u53f0\u72ec|\u53f0\u6bd2|\u53f0du|taidu|twdl|\u4e00\u4e2d\u4e00\u53f0|\u6253\u53f0\u6e7e|\u4e24\u5cb8\u6218\u4e89|\u653b\u5360\u53f0\u6e7e|\u652f\u6301\u53f0\u6e7e|\u8fdb\u653b\u53f0\u6e7e|\u5360\u9886\u53f0\u6e7e|\u7edf\u4e00\u53f0\u6e7e|\u6536\u590d\u53f0\u6e7e|\u767b\u9646\u53f0\u6e7e|\u89e3\u653e\u53f0\u6e7e|\u89e3\u653etw|\u89e3\u51b3\u53f0\u6e7e|\u5149\u590d\u6c11\u56fd|\u53f0\u6e7e\u72ec\u7acb|\u53f0\u6e7e\u95ee\u9898|\u53f0\u6d77\u95ee\u9898|\u53f0\u6d77\u5371\u673a|\u53f0\u6d77\u7edf\u4e00|\u53f0\u6d77\u5927\u6218|\u53f0\u6d77\u6218\u4e89|\u53f0\u6d77\u5c40\u52bf|\u5165\u8054|\u5165\u8033\u5173|\u4e2d\u534e\u8054\u90a6|\u56fd\u6c11\u515a|x\u6c11\u515a|\u6c11\u8fdb\u515a|\u9752\u5929\u767d\u65e5|\u95f9\u72ec\u7acb|duli|fenlie|\u65e5\u672c\u4e07\u5c81|\u5c0f\u6cfd\u4e00\u90ce|\u52a3\u7b49\u6c11\u65cf|\u6c49\u4eba|\u6c49\u7ef4|\u7ef4\u6c49|\u7ef4\u543e|\u543e\u5c14|\u70ed\u6bd4\u5a05|\u4f0a\u529b\u54c8\u6728|\u7586\u72ec|\u4e1c\u7a81\u53a5\u65af\u5766\u89e3\u653e\u7ec4\u7ec7|\u4e1c\u7a81\u89e3\u653e\u7ec4\u7ec7|\u8499\u53e4\u5206\u88c2\u5206\u5b50|\u5217\u786e|\u963f\u65fa\u664b\u7f8e|\u85cf\u4eba|\u81e7\u4eba|zang\u4eba|\u85cf\u6c11|\u85cfm|\u8fbe\u8d56|\u8d56\u8fbe|dalai|\u54d2\u8d56|dl\u5587\u561b|\u4e39\u589e\u5609\u63aa|\u6253\u7838\u62a2|\u897f\u72ec|\u85cf\u72ec|\u846c\u72ec|\u81e7\u72ec|\u85cf\u6bd2|\u85cfdu|zangdu|\u652f\u6301zd|\u85cf\u66b4\u4e71|\u85cf\u9752\u4f1a|\u96ea\u5c71\u72ee\u5b50\u65d7|\u62c9\u8428|\u5566\u8428|\u5566\u6c99|\u5566\u6492|\u62c9sa|lasa|la\u8428|\u897f\u85cf|\u85cf\u897f|\u85cf\u6625\u9601|\u85cf\ufffd\u009a|\u85cf\u72ec|\u85cf\u72ec\u7acb|\u85cf\u5987\u4f1a|\u85cf\u9752\u4f1a|\u85cf\u5b57\u77f3|xizang|xi\u85cf|x\u85cf|\u897fz|tibet|\u5e0c\u846c|\u5e0c\u85cf|\u7852\u85cf|\u7a00\u85cf|\u897f\u810f|\u897f\u5958|\u897f\u846c|\u897f\u81e7|\u63f4\u85cf|bjork|\u738b\u5343\u6e90|\u5b89\u62c9|\u56de\u6559|\u56de\u65cf|\u56de\u56de|\u56de\u6c11|\u7a46\u65af\u6797|\u7a46\u7f55\u7a46\u5fb7|\u7a46\u7f55\u9ed8\u5fb7|\u9ed8\u7f55\u9ed8\u5fb7|\u4f0a\u65af\u5170|\u5723\u6218\u7ec4\u7ec7|\u6e05\u771f|\u6e05zhen|qingzhen|\u771f\u4e3b|\u963f\u62c9\u4f2f|\u9ad8\u4e3d\u68d2\u5b50|\u97e9\u56fd\u72d7|\u6ee1\u6d32\u7b2c\u4e09\u5e1d\u56fd|\u6ee1\u72d7|\u9791\u5b50|\u6c5f\u4e11\u95fb|\u6c5f\u5ae1\u7cfb|\u6c5f\u6bd2|\u6c5f\u72ec\u88c1|\u6c5f\u86e4\u87c6|\u6c5f\u6838\u5fc3|\u6c5f\u9ed1\u5fc3|\u6c5f\u80e1\u5185\u6597|\u6c5f\u7978\u5fc3|\u6c5f\u5bb6\u5e2e|\u6c5f\u7ef5\u6052|\u6c5f\u6d3e\u548c\u80e1\u6d3e|\u6c5f\u6d3e\u4eba\u9a6c|\u6c5f\u6cc9\u96c6\u56e2|\u6c5f\u4eba\u9a6c|\u6c5f\u4e09\u6761\u817f|\u6c5f\u6c0f\u96c6\u56e2|\u6c5f\u6c0f\u5bb6\u65cf|\u6c5f\u6c0f\u653f\u6cbb\u5c40|\u6c5f\u6c0f\u653f\u6cbb\u59d4\u5458|\u6c5f\u68b3\u5934|\u6c5f\u592a\u4e0a|\u6c5f\u620f\u5b50|\u6c5f\u7cfb\u4eba|\u6c5f\u7cfb\u4eba\u9a6c|\u6c5f\u5bb0\u6c11|\u6c5f\u8d3c|\u6c5f\u8d3c\u6c11|\u6c5f\u4e3b\u5e2d|\u9ebb\u679c\u4e38|\u9ebb\u5c06\u900f|\u9ebb\u9189\u5f39|\u9ebb\u9189\u72d7|\u9ebb\u9189\u67aa|\u9ebb\u9189\u0098\u008c|\u9ebb\u9189\u836f|\u53f0\u72ec|\u53f0\u6e7e|\u4e2d\u5171|\u8bc9\u6c42|\u64a4\u56de|\u70ae\u6253|\u5927\u5b57\u62a5|\u8fde\u519c|\u8fde\u4fac|\u5171\u6597|\u6b66\u6c49|\u80ba\u708e|\u5c0f\u7c89\u7ea2|\u7ef4\u5c3c|\u5bf9\u5cb8|\u4e2d\u56fd\u4eba|\u72ec\u7acb|\u7fd2\u8fd1\u5e73|\u5e73\u8fd1\u7fd2|xjp|\u7fd2\u592a\u5b50|\u7fd2\u660e\u6fa4|\u8001\u7fd2|\u6eab\u5bb6\u5bf6|\u6eab\u52a0\u5bf6|\u6eabx|\u6eabjia\u5bf6|\u6eab\u5bf6\u5bf6|\u6eab\u52a0\u98fd|\u6eab\u52a0\u4fdd|\u5f35\u57f9\u8389|\u6eab\u96f2\u9b06|\u6eab\u5982\u6625|\u6eabjb|\u80e1\u6eab|\u80e1x|\u80e1jt|\u80e1boss|\u80e1\u7e3d|\u80e1\u738b\u516b|hujintao|\u80e1jintao|\u80e1j\u6fe4|\u80e1\u9a5a\u6fe4|\u80e1\u666f\u6fe4|\u80e1\u7dca\u638f|\u6e56\u7dca\u638f|\u80e1\u7dca\u5957|\u9326\u6fe4|hjt|\u80e1\u6d3e|\u80e1\u4e3b\u5e2d|\u5289\u6c38\u6e05|\u80e1\u6d77\u5cf0|\u80e1\u6d77\u6e05|\u6c5f\u6fa4\u6c11|\u6c11\u6fa4\u6c5f|\u6c5f\u80e1|\u6c5f\u54e5|\u6c5f\u4e3b\u5e2d|\u6c5f\u66f8\u8a18|\u6c5f\u6d59\u95a9|\u6c5f\u6ca2\u6c11|\u6c5f\u6d59\u6c11|\u64c7\u6c11|\u5247\u6c11|\u8333\u6fa4\u6c11|zemin|ze\u6c11|\u8001\u6c5f|\u8001j|\u6c5fcore|\u6c5fx|\u6c5f\u6d3e|\u6c5fzm|jzm|\u6c5f\u6232\u5b50|\u6c5f\u86e4\u87c6|\u6c5f\u67d0\u67d0|\u6c5f\u8cca|\u6c5f\u8c6c|\u6c5f\u6c0f\u96c6\u5718|\u6c5f\u7dbf\u6046|\u6c5f\u7dbf\u5eb7|\u738b\u51b6\u576a|\u6c5f\u6fa4\u6167|\u9127\u5c0f\u5e73|\u5e73\u5c0f\u9127|xiao\u5e73|\u9127xp|\u9127\u66c9\u5e73|\u9127\u6a38\u65b9|\u9127\u6995|\u9127\u8cea\u65b9|\u6bdb\u6fa4\u6771|\u8c93\u6fa4\u6771|\u8c93\u5247\u6771|\u8c93\u8cca\u6d1e|\u6bdbzd|\u6bdbzx|z\u6771|ze\u6771|\u6fa4d|zedong|\u6bdb\u592a\u7956|\u6bdb\u76f8|\u4e3b\u5e2d\u756b\u50cf|\u6539\u9769\u6b77\u7a0b|\u6731\u9394\u57fa|\u6731\u5bb9\u57fa|\u6731\u9394\u96de|\u6731\u5bb9\u96de|\u6731\u96f2\u4f86|\u674e\u9d6c|\u674epeng|\u88e1\u9d6c|\u674e\u6708\u6708\u9ce5|\u674e\u5c0f\u9d6c|\u674e\u5c0f\u7433|\u83ef\u4e3b\u5e2d|\u83ef\u570b|\u570b\u92d2|\u570b\u5cf0|\u92d2\u540c\u5fd7|\u767d\u6625\u79ae|\u8584\u7199\u4f86|\u8584\u4e00\u6ce2|\u8521\u8d74\u671d|\u8521\u6b66|\u66f9\u525b\u5ddd|\u5e38\u842c\u5168|\u9673\u70b3\u5fb7|\u9673\u5fb7\u9298|\u9673\u5efa\u570b|\u9673\u826f\u5b87|\u9673\u7d39\u57fa|\u9673\u540c\u6d77|\u9673\u81f3\u7acb|\u6234\u79c9\u570b|\u4e01\u4e00\u5e73|\u8463\u5efa\u83ef|\u675c\u5fb7\u5370|\u675c\u4e16\u6210|\u5085\u92b3|\u90ed\u4f2f\u96c4|\u90ed\u91d1\u9f8d|\u8cc0\u570b\u5f37|\u80e1\u6625\u83ef|\u8000\u90a6|\u83ef\u5efa\u654f|\u9ec3\u83ef\u83ef|\u9ec3\u9e97\u6eff|\u9ec3\u8208\u570b|\u56de\u826f\u7389|\u8cc8\u6176\u6797|\u8cc8\u5ef7\u5b89|\u9756\u5fd7\u9060|\u674e\u9577\u6625|\u674e\u6625\u57ce|\u674e\u5efa\u570b|\u674e\u514b\u5f37|\u674e\u5d50\u6e05|\u674e\u6c9b\u7464|\u674e\u69ae\u878d|\u674e\u745e\u74b0|\u674e\u9435\u6620|\u674e\u5148\u5ff5|\u674e\u5b78\u8209|\u674e\u6e90\u6f6e|\u6144\u667a|\u6a11\u5149\u70c8|\u5ed6\u932b\u9f8d|\u6797\u6a39\u68ee|\u6797\u708e\u5fd7|\u6797\u5de6\u9cf4|\u4ee4\u8a08\u5283|\u67f3\u658c\u6770|\u5289\u5947\u8446|\u5289\u5c11\u5947|\u5289\u5ef6\u6771|\u5289\u96f2\u5c71|\u5289\u5fd7\u8ecd|\u9f8d\u65b0\u6c11|\u8def\u752c\u7965|\u7f85\u7bad|\u5442\u7956\u5584|\u99ac\u98c8|\u99ac\u6137|\u5b5f\u5efa\u67f1|\u6b50\u5ee3\u6e90|\u5f37\u885b|\u6c88\u8e8d\u8e8d|\u5b8b\u5e73\u9806|\u7c9f\u620e\u751f|\u8607\u6a39\u6797|\u5b6b\u5bb6\u6b63|\u9435\u51dd|\u5c60\u5149\u7d39|\u738b\u6771\u660e|\u6c6a\u6771\u8208|\u738b\u9d3b\u8209|\u738b\u6eec\u5be7|\u738b\u6a02\u6cc9|\u738b\u6d1b\u6797|\u738b\u5c90\u5c71|\u738b\u52dd\u4fca|\u738b\u592a\u83ef|\u738b\u5b78\u8ecd|\u738b\u5146\u570b|\u738b\u632f\u83ef|\u5433\u90a6\u570b|\u5433\u5b9a\u5bcc|\u5433\u5b98\u6b63|\u7121\u5b98\u6b63|\u5433\u52dd\u5229|\u5433\u5100|\u595a\u570b\u83ef|\u7fd2\u4ef2\u52f3|\u5f90\u624d\u539a|\u8a31\u5176\u4eae|\u5f90\u7d39\u53f2|\u694a\u6f54\u7bea|\u8449\u528d\u82f1|\u7531\u559c\u8cb4|\u4e8e\u5e7c\u8ecd|\u4fde\u6b63\u8072|\u8881\u7d14\u6e05|\u66fe\u57f9\u708e|\u66fe\u6176\u7d05|\u66fe\u61b2\u6893|\u66fe\u852d\u6b0a|\u5f35\u5fb7\u6c5f|\u5f35\u5b9a\u767c|\u5f35\u9ad8\u9e97|\u5f35\u7acb\u660c|\u5f35\u69ae\u5764|\u5f35\u5fd7\u570b|\u8d99\u6d2a\u795d|\u7d2b\u967d|\u5468\u751f\u8ce2|\u5468\u6c38\u5eb7|\u6731\u6d77\u4f96|\u4e2d\u5357\u6d77|\u5927\u9678\u7576\u5c40|\u4e2d\u570b\u7576\u5c40|\u5317\u4eac\u7576\u5c40|\u5171\u7522\u9ee8|\u9ee8\u7522\u5171|\u5171\u8caa\u9ee8|\u963f\u5171|\u7522\u9ee8\u5171|\u516c\u7522\u9ee8|\u5de5\u7522\u9ee8|\u5171c\u9ee8|\u5171x\u9ee8|\u5171\u5277|\u4f9b\u7522|\u5171\u6158|\u4f9b\u93df\u9ee8|\u4f9b\u93df\u8b9c|\u4f9b\u93df\u8960|\u5171\u6b98\u9ee8|\u5171\u6b98\u4e3b\u7fa9|\u5171\u7522\u4e3b\u7fa9\u7684\u5e7d\u9748|\u62f1\u93df|\u8001\u5171|\u4e2d\u5171|\u4e2d\u73d9|\u4e2dgong|gc\u9ee8|\u8ca2\u64cb|gong\u9ee8|g\u7522|\u72d7\u7522\u86cb|\u5171\u6b98\u8960|\u60e1\u9ee8|\u90aa\u9ee8|\u5171\u7522\u5c08\u5236|\u5171\u7522\u738b\u671d|\u8960\u4e2d\u592e|\u571f\u5171|\u571fg|\u5171\u72d7|g\u532a|\u5171\u532a|\u4ec7\u5171|\u653f\u5e9c|\u75c7\u8150|\u653f\u8150|\u653f\u4ed8|\u6b63\u5e9c|\u653f\u4fef|\u653ff|zhengfu|\u653fzhi|\u64cb\u4e2d\u592e|\u6a94\u4e2d\u592e|\u4e2d\u592e\u9818\u5c0e|\u4e2d\u570bzf|\u4e2d\u592ezf|\u570bwu\u9662|\u4e2d\u83ef\u5e1d\u570b|gong\u548c|\u5927\u9678\u5b98\u65b9|\u5317\u4eac\u653f\u6b0a|\u6c5f\u6fa4\u6c11|\u80e1\u9326\u6fe4|\u6eab\u5bb6\u5bf6|\u7fd2\u8fd1\u5e73|\u7fd2\u4ef2\u52f3|\u8cc0\u570b\u5f37|\u8cc0\u5b50\u73cd|\u5468\u6c38\u5eb7|\u674e\u9577\u6625|\u674e\u5fb7\u751f|\u738b\u5c90\u5c71|\u59da\u4f9d\u6797|\u56de\u826f\u7389|\u674e\u6e90\u6f6e|\u674e\u5e79\u6210|\u6234\u79c9\u570b|\u9ec3\u93ae|\u5289\u5ef6\u6771|\u5289\u745e\u9f8d|\u4fde\u6b63\u8072|\u9ec3\u656c|\u8584\u7199|\u8584\u4e00\u6ce2|\u5468\u5c0f\u5ddd|\u5468\u5efa\u5357|\u6eab\u96f2\u9b06|\u5f90\u660e|\u6c5f\u6fa4\u6167|\u6c5f\u7dbf\u6046|\u6c5f\u7dbf\u5eb7|\u674e\u5c0f\u9d6c|\u674e\u9d6c|\u674e\u5c0f\u7433|\u6731\u96f2\u4f86|\u6731\u5bb9\u57fa|\u6cd5\u8f2a\u529f|\u674e\u6d2a\u5fd7|\u65b0\u7586\u9a37\u4e82|\u7fd2\u8fd1\u5e73|\u7fd2\u4ef2\u52f3|\u5341\u4e5d\u5927\u4fee\u61b2|\u7fd2\u8fd1\u5e73\u9023\u4efb|\u61b2\u6cd5\u4fee\u6b63\u6848|\u4efb\u671f\u9650\u5236|\u8150\u6557\u4e2d\u570b|\u4e09\u500b\u4ee3\u8868|\u793e\u6703\u4e3b\u7fa9\u6ec5\u4ea1|\u6253\u5012\u4e2d\u570b|\u6253\u5012\u5171\u7522\u9ee8|\u6253\u5012\u5171\u7522\u4e3b\u7fa9|\u6253\u5012\u80e1\u9326\u6fe4|\u6253\u5012\u6c5f\u6fa4\u6c11|\u6253\u5012\u6c5f\u4e3b\u5e2d|\u6253\u5012\u7f85\u5e79|\u6253\u5012\u4e2d\u5171|\u62b5\u5236\u5171\u7522\u9ee8|\u62b5\u5236\u5171\u7522\u4e3b\u7fa9|\u62b5\u5236\u80e1\u9326\u6fe4|\u62b5\u5236\u6c5f\u6fa4\u6c11|\u62b5\u5236\u6c5f\u4e3b\u5e2d|\u62b5\u5236\u674e\u9d6c|\u62b5\u5236\u7f85\u5e79|\u62b5\u5236\u6eab\u5bb6\u5bf6|\u62b5\u5236\u4e2d\u5171|\u62b5\u5236\u6731\ufffdF\u57fa|\u6ec5\u4ea1\u4e2d\u570b|\u4ea1\u9ee8\u4ea1\u570b|\u7c89\u788e\u56db\u4eba\u5e6b|\u6fc0\u6d41\u4e2d\u570b|\u7279\u4f9b|\u7279\u8ca2|\u7279\u5171|zf\u5927\u6a13|\u6b83\u8996|\u8caa\u6c59\u8150\u6557|\u5f37\u5236\u62c6\u9664|\u5f62\u5f0f\u4e3b\u7fa9|\u653f\u6cbb\u98a8\u6ce2|\u592a\u5b50\u9ee8|\u4e0a\u6d77\u5e6b|\u5317\u4eac\u5e6b|\u6e05\u83ef\u5e6b|\u7d05\u8272\u8cb4\u65cf|\u6b0a\u8cb4\u96c6\u5718|\u6cb3\u87f9\u793e\u6703|\u559d\u8840\u793e\u6703|\u4e5d\u98a8|9\u98a8|\u5341\u4e03\u5927|\u53417\u5927|17da|\u4e5d\u5b78|9\u5b78|\u56db\u98a8|4\u98a8|\u96d9\u898f|\u5357\u8857\u6751|\u6700\u6deb\u5b98\u54e1|\u8b66\u532a|\u5b98\u532a|\u7368\u592b\u6c11\u8cca|\u5b98\u5546\u52fe\u7d50|\u57ce\u7ba1\u66b4\u529b\u57f7\u6cd5|\u5f37\u5236\u6350\u6b3e|\u6bd2\u8c7a|\u4e00\u9ee8\u57f7\u653f|\u4e00\u9ee8\u5c08\u5236|\u4e00\u9ee8\u5c08\u653f|\u5c08\u5236\u653f\u6b0a|\u61b2\u6cd5\u6cd5\u9662|\u80e1\u5e73|\u8607\u66c9\u5eb7|\u8cc0\u885b\u65b9|\u8b5a\u4f5c\u4eba|\u7126\u570b\u6a19|\u842c\u6f64\u5357|\u5f35\u5fd7\u65b0|\u9ad8\u52e4\u69ae|\u738b\u70b3\u7ae0|\u9ad8\u667a\u665f|\u53f8\u99ac\u7490|\u5289\u66c9\u7af9|\u5289\u8cd3\u96c1|\u9b4f\u4eac\u751f|\u5c0b\u627e\u6797\u662d\u7684\u9748\u9b42|\u5225\u5922\u6210\u7070|\u8ab0\u662f\u65b0\u4e2d\u570b|\u8a0e\u4f10\u4e2d\u5ba3\u90e8|\u7570\u8b70\u4eba\u58eb|\u6c11\u904b\u4eba\u58eb|\u555f\u8499\u6d3e|\u9078\u570b\u5bb6\u4e3b\u5e2d|\u6c11\u4e00\u4e3b|min\u4e3b|\u6c11\u7af9|\u6c11\u73e0|\u6c11\u8c6c|chinesedemocracy|\u5927\u8d66\u570b\u969b|\u570b\u969b\u7279\u8d66|da\u9078|\u6295\u516c|\u516c\u982d|\u61b2\u653f|\u5e73\u53cd|\u9ee8\u7ae0|\u7dad\u6b0a|\u661d\u611b\u5b97|\u61b2\u7ae0|08\u61b2|08xz|\u62bf\u4e3b|\u654f\u4e3b|\u4eba\u62f3|\u4eba\u6728\u53c8|\u4ebaquan|renquan|\u4e2d\u570b\u4eba\u6b0a|\u4e2d\u570b\u65b0\u6c11\u9ee8|\u7fa4\u9ad4\u4e8b\u4ef6|\u7fa4\u9ad4\u6027\u4e8b\u4ef6|\u4e0a\u4e2d\u592e|\u53bb\u4e2d\u592e|\u8a0e\u8aaa\u6cd5|\u8acb\u9858|\u8acb\u547d|\u516c\u958b\u4fe1|\u806f\u540d\u4e0a\u66f8|\u842c\u4eba\u5927\u7c3d\u540d|\u842c\u4eba\u9a37\u52d5|\u622a\u8a2a|\u4e0a\u8a2a|shangfang|\u4fe1\u8a2a|\u8a2a\u6c11|\u96c6\u5408|\u96c6\u6703|\u7d44\u7e54\u96c6\u9ad4|\u975c\u5750|\u975czuo|jing\u5750|\u793a\u5a01|\u793awei|\u904a\u884c|you\u884c|\u6cb9\u884c|\u904axing|youxing|\u5b98\u903c\u6c11\u53cd|\u53cdparty|\u53cd\u5171|\u6297\u8b70|\u4ea2\u8b70|\u62b5\u5236|\u4f4e\u5236|\u5e95\u5236|di\u5236|\u62b5zhi|dizhi|boycott|\u8840\u66f8|\u711a\u71d2\u4e2d\u570b\u570b\u65d7|baoluan|\u6d41\u8840\u885d\u7a81|\u51fa\u73fe\u66b4\u52d5|\u767c\u751f\u66b4\u52d5|\u5f15\u8d77\u66b4\u52d5|baodong|\u6ec5\u5171|\u6bba\u6583|\u7f77\u5de5|\u9738\u5de5|\u7f77\u8003|\u7f77\u9910|\u9738\u9910|\u7f77\u53c3|\u7f77\u98ef|\u7f77\u5403|\u7f77\u98df|\u7f77\u8ab2|\u7f77ke|\u9738\u8ab2|ba\u8ab2|\u7f77\u6559|\u7f77\u5b78|\u7f77\u904b|\u7db2\u7279|\u7db2\u8a55\u54e1|\u7db2\u7d61\u8a55\u8ad6\u54e1|\u4e94\u6bdb\u9ee8|\u4e94\u6bdb\u5011|5\u6bdb\u9ee8|\u6212\u56b4|jieyan|jie\u56b4|\u6212yan|8\u7684\u5e73\u65b9\u4e8b\u4ef6|\u77e5\u905364|\u516b\u4e5d\u5e74|\u8cb3\u62fe\u5e74|2o\u5e74|20\u548c\u8ae7\u5e74|\u8cb3\u62fe\u9031\u5e74|\u516d\u56db|\u516d\u6cb3\u87f9\u56db|\u516d\u767e\u5ea6\u56db|\u516d\u548c\u8ae7\u56db|\u9678\u56db|\u9678\u8086|198964|5\u670835|89\u5e74\u6625\u590f\u4e4b\u4ea4|64\u6158\u6848|64\u6642\u671f|64\u904b\u52d5|4\u4e8b\u4ef6|\u56db\u4e8b\u4ef6|\u5317\u4eac\u98a8\u6ce2|\u5b78\u6f6e|\u5b78chao|xuechao|\u5b78\u767e\u5ea6\u6f6e|\u9580\u5b89\u5929|\u5929\u6309\u9580|\u5766\u514b\u58d3\u5927\u5b78\u751f|\u6c11\u4e3b\u5973\u795e|\u6b77\u53f2\u7684\u50b7\u53e3|\u9ad8\u81ea\u806f|\u5317\u9ad8\u806f|\u8840\u6d17\u4eac\u57ce|\u56db\u4e8c\u516d\u793e\u8ad6|\u738b\u4e39|\u67f4\u73b2|\u6c88\u5f64|\u5c01\u5f9e\u5fb7|\u738b\u8d85\u83ef|\u738b\u7dad\u6797|\u543e\u723e\u958b\u5e0c|\u543e\u723e\u958b\u897f|\u4faf\u5fb7\u5065|\u95bb\u660e\u8986|\u65b9\u52f5\u4e4b|\u8523\u6377\u9023|\u4e01\u5b50\u9716|\u8f9b\u705d\u5e74|\u8523\u5f65\u6c38|\u56b4\u5bb6\u5176|\u9673\u4e00\u8aee|\u4e2d\u83ef\u5c40\u57df\u7db2|\u9ee8\u7684\u5589\u820c|\u4e92\u806f\u7db2\u5be9\u67e5|\u7576\u5c40\u56b4\u5bc6\u5c01\u9396|\u65b0\u805e\u5c01\u9396|\u5c01\u9396\u6d88\u606f|\u611b\u570b\u8005\u540c\u76df|\u95dc\u9589\u6240\u6709\u8ad6\u58c7|\u7db2\u7d61\u5c01\u9396|\u91d1\u76fe\u5de5\u7a0b|gfw|\u7121\u754c\u700f\u89bd|\u7121\u754c\u7db2\u7d61|\u81ea\u7531\u9580|\u4f55\u6e05\u6f23|\u4e2d\u570b\u7684\u9677\u9631|\u6c6a\u5146\u921e|\u8a18\u8005\u7121\u7586\u754c|\u5883\u5916\u5a92\u9ad4|\u7dad\u57fa\u767e\u79d1|\u7d10\u7d04\u6642\u5831|bbc\u4e2d\u6587\u7db2|\u83ef\u76db\u9813\u90f5\u5831|\u4e16\u754c\u65e5\u5831|\u6771\u68ee\u65b0\u805e\u7db2|\u6771\u68ee\u96fb\u8996|\u661f\u5cf6\u65e5\u5831|wikipedia|youtube|googleblogger|\u7f8e\u570b\u5ee3\u64ad\u516c\u53f8|\u82f1\u570b\u91d1\u878d\u6642\u5831|\u81ea\u7531\u4e9e\u6d32|\u81ea\u7531\u6642\u5831|\u4e2d\u570b\u6642\u5831|\u53cd\u5206\u88c2|\u5a01\u8105\u8ad6|\u5de6\u7ffc\u806f\u76df|\u91e3\u9b5a\u5cf6|\u4fdd\u91e3\u7d44\u7e54|\u4e3b\u6b0a|\u5f13\u55ae|\u706b\u4e4d|\u6728\u5009|\u77f3\u8096|\u6838\u86cb|\u6b65qiang|bao\u70b8|\u7206zha|baozha|zha\u85e5|zha\u5f48|\u70b8dan|\u70b8yao|zhadan|zhayao|hmtd|\u4e09\u785d\u57fa\u7532\u82ef|\u516d\u6c1f\u5316\u923e|\u70b8\u85e5\u914d\u65b9|\u5f48\u85e5\u914d\u65b9|\u70b8\u5f48\u914d\u65b9|\u76ae\u7bb1\u70b8\u5f48|\u706b\u85e5\u914d\u65b9|\u4eba\u9ad4\u70b8\u5f48|\u4eba\u8089\u70b8\u5f48|\u89e3\u653e\u8ecd|\u5175\u529b\u90e8\u7f72|\u8ecd\u8f49|\u8ecd\u4e8b\u793e|8341\u90e8\u968a|\u7b2c21\u96c6\u5718\u8ecd|\u4e03\u5927\u8ecd\u5340|7\u5927\u8ecd\u5340|\u5317\u4eac\u8ecd\u5340|\u700b\u967d\u8ecd\u5340|\u6fdf\u5357\u8ecd\u5340|\u6210\u90fd\u8ecd\u5340|\u5ee3\u5dde\u8ecd\u5340|\u5357\u4eac\u8ecd\u5340|\u862d\u5dde\u8ecd\u5340|\u984f\u8272\u9769\u547d|\u898f\u6a21\u885d\u7a81|\u5854\u5229\u73ed|\u57fa\u5730\u7d44\u7e54|\u6050\u6016\u5206\u5b50|\u6050\u6016\u4efd\u5b50|\u4e09\u80a1\u52e2\u529b|\u5370\u5c3c\u5c60\u83ef|\u5370\u5c3c\u4e8b\u4ef6|\u8523\u516c\u7d00\u5ff5\u6b4c|\u99ac\u82f1\u4e5d|mayingjiu|\u674e\u5929\u7fbd|\u8607\u8c9e\u660c|\u6797\u6587\u6f2a|\u9673\u6c34\u6241|\u9673s\u6241|\u9673\u96a8\u4fbf|\u963f\u6241|a\u6241|\u544a\u5168\u570b\u540c\u80de\u66f8|\u81fa\u767e\u5ea6\u7063|\u81fa\u5b8c|\u81fawan|taiwan|\u81fa\u5f4e|\u7063\u81fa|\u81fa\u7063\u570b|\u81fa\u7063\u5171\u548c\u570b|\u81fa\u8ecd|\u81fa\u7368|\u81fa\u6bd2|\u81fadu|taidu|twdl|\u4e00\u4e2d\u4e00\u81fa|\u6253\u81fa\u7063|\u5169\u5cb8\u6230\u722d|\u653b\u4f54\u81fa\u7063|\u652f\u6301\u81fa\u7063|\u9032\u653b\u81fa\u7063|\u4f54\u9818\u81fa\u7063|\u7d71\u4e00\u81fa\u7063|\u6536\u5fa9\u81fa\u7063|\u767b\u9678\u81fa\u7063|\u89e3\u653e\u81fa\u7063|\u89e3\u653etw|\u89e3\u6c7a\u81fa\u7063|\u5149\u5fa9\u6c11\u570b|\u81fa\u7063\u7368\u7acb|\u81fa\u7063\u554f\u984c|\u81fa\u6d77\u554f\u984c|\u81fa\u6d77\u5371\u6a5f|\u81fa\u6d77\u7d71\u4e00|\u81fa\u6d77\u5927\u6230|\u81fa\u6d77\u6230\u722d|\u81fa\u6d77\u5c40\u52e2|\u5165\u806f|\u5165\u8033\u95dc|\u4e2d\u83ef\u806f\u90a6|\u570b\u6c11\u9ee8|x\u6c11\u9ee8|\u6c11\u9032\u9ee8|\u9752\u5929\u767d\u65e5|\u9b27\u7368\u7acb|duli|fenlie|\u65e5\u672c\u842c\u6b72|\u5c0f\u6fa4\u4e00\u90ce|\u52a3\u7b49\u6c11\u65cf|\u6f22\u4eba|\u6f22\u7dad|\u7dad\u6f22|\u7dad\u543e|\u543e\u723e|\u71b1\u6bd4\u5a6d|\u4f0a\u529b\u54c8\u6728|\u7586\u7368|\u6771\u7a81\u53a5\u65af\u5766\u89e3\u653e\u7d44\u7e54|\u6771\u7a81\u89e3\u653e\u7d44\u7e54|\u8499\u53e4\u5206\u88c2\u5206\u5b50|\u5217\u78ba|\u963f\u65fa\u6649\u7f8e|\u85cf\u4eba|\u81e7\u4eba|zang\u4eba|\u85cf\u6c11|\u85cfm|\u9054\u8cf4|\u8cf4\u9054|dalai|\u5660\u8cf4|dl\u5587\u561b|\u4e39\u589e\u5609\u63aa|\u6253\u7838\u6436|\u897f\u7368|\u85cf\u7368|\u846c\u7368|\u81e7\u7368|\u85cf\u6bd2|\u85cfdu|zangdu|\u652f\u6301zd|\u85cf\u66b4\u4e82|\u85cf\u9752\u6703|\u96ea\u5c71\u7345\u5b50\u65d7|\u62c9\u85a9|\u5566\u85a9|\u5566\u6c99|\u5566\u6492|\u62c9sa|lasa|la\u85a9|\u897f\u85cf|\u85cf\u897f|\u85cf\u6625\u95a3|\u85cf\ufffd\u009a|\u85cf\u7368|\u85cf\u7368\u7acb|\u85cf\u5a66\u6703|\u85cf\u9752\u6703|\u85cf\u5b57\u77f3|xizang|xi\u85cf|x\u85cf|\u897fz|tibet|\u5e0c\u846c|\u5e0c\u85cf|\u7852\u85cf|\u7a00\u85cf|\u897f\u9ad2|\u897f\u5958|\u897f\u846c|\u897f\u81e7|\u63f4\u85cf|bjork|\u738b\u5343\u6e90|\u5b89\u62c9|\u56de\u6559|\u56de\u65cf|\u56de\u56de|\u56de\u6c11|\u7a46\u65af\u6797|\u7a46\u7f55\u7a46\u5fb7|\u7a46\u7f55\u9ed8\u5fb7|\u9ed8\u7f55\u9ed8\u5fb7|\u4f0a\u65af\u862d|\u8056\u6230\u7d44\u7e54|\u6e05\u771f|\u6e05zhen|qingzhen|\u771f\u4e3b|\u963f\u62c9\u4f2f|\u9ad8\u9e97\u68d2\u5b50|\u97d3\u570b\u72d7|\u6eff\u6d32\u7b2c\u4e09\u5e1d\u570b|\u6eff\u72d7|\u97c3\u5b50|\u6c5f\u919c\u805e|\u6c5f\u5ae1\u7cfb|\u6c5f\u6bd2|\u6c5f\u7368\u88c1|\u6c5f\u86e4\u87c6|\u6c5f\u6838\u5fc3|\u6c5f\u9ed1\u5fc3|\u6c5f\u80e1\u5167\u9b25|\u6c5f\u798d\u5fc3|\u6c5f\u5bb6\u5e6b|\u6c5f\u7dbf\u6046|\u6c5f\u6d3e\u548c\u80e1\u6d3e|\u6c5f\u6d3e\u4eba\u99ac|\u6c5f\u6cc9\u96c6\u5718|\u6c5f\u4eba\u99ac|\u6c5f\u4e09\u689d\u817f|\u6c5f\u6c0f\u96c6\u5718|\u6c5f\u6c0f\u5bb6\u65cf|\u6c5f\u6c0f\u653f\u6cbb\u5c40|\u6c5f\u6c0f\u653f\u6cbb\u59d4\u54e1|\u6c5f\u68b3\u982d|\u6c5f\u592a\u4e0a|\u6c5f\u6232\u5b50|\u6c5f\u7cfb\u4eba|\u6c5f\u7cfb\u4eba\u99ac|\u6c5f\u5bb0\u6c11|\u6c5f\u8cca|\u6c5f\u8cca\u6c11|\u6c5f\u4e3b\u5e2d|\u9ebb\u679c\u4e38|\u9ebb\u5c07\u900f|\u9ebb\u9189\u5f48|\u9ebb\u9189\u72d7|\u9ebb\u9189\u69cd|\u9ebb\u9189\u0098\u008c|\u9ebb\u9189\u85e5|\u81fa\u7368|\u81fa\u7063|\u4e2d\u5171|\u8a34\u6c42|\u64a4\u56de|\u70ae\u6253|\u5927\u5b57\u5831|\u9023\u8fb2|\u9023\u5102|\u5171\u9b25|\u6b66\u6f22|\u80ba\u708e|\u5c0f\u7c89\u7d05|\u7dad\u5c3c|\u5c0d\u5cb8|\u4e2d\u570b\u4eba|\u7368\u7acb"')


function htmlEscape(text) {
    return text.replace(/[<>"&]/g, function (match, pos, originalText) {
        switch (match) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "\"":
                return '"';
        }
    });
}

function danmuObject2XML(ldanmu) {
    var tldanmu = []
    for (var i = 0, length = ldanmu.length; i < length; i++) {
        var danmu = ldanmu[i]
        tldanmu.push('<d p="' + [(danmu.progress / 1000).toFixed(2), danmu.mode, danmu.fontsize, danmu.color, danmu.ctime, 1, danmu.midHash, danmu.idStr].join(',') + '">' + htmlEscape(danmu.content) + '</d>')
    }
    return tldanmu
}

function mergeOutsideDanmaku(ssid, ipage, ndanmu) {
    if (setting === null) {
        setting = window.setting
    }
    var url = 'https://delflare505.win:800/getBindInfo?ss=' + ssid + '&index=' + ipage
    if (setting.translateNicoComment) {
        url += '&translate=1'
    }
    if (setting.nicoDanmuRate) {
        url += '&niconum=' + Math.floor(ndanmu * setting.nicoDanmuRate)
    }
    var xhrResponse = http.get(url)
    var nicoDanmu = xhrResponse.body.string()
    if (nicoDanmu === 'null') {
        return []
    }
    var lbahadanmu = []
    var lNicoDanmu = []
    var lsn = JSON.parse(xhrResponse.headers['content-type'].slice(25))

    for (var cid of lsn) {
        if (typeof (cid) == 'string') {
            if (cid.startsWith('sn')) {
                var res = dmFengDanmaku(cid.slice(2), 0)
                lbahadanmu = lbahadanmu.concat(res)
                console.log('load:' + cid + '(', len(res), ')')
            }
        }
        // else if (cid instanceof Array) {
        //     for (var dcid of cid[ipage]) {
        //         ldanmu = ldanmu.concat(( moreFiltedHistory(dcid, duration))[0])
        //     }
        // }
    }
    if (nicoDanmu[0] !== 's') {
        var res = parseNicoResponse(nicoDanmu, 0)
        if (setting.replaceKatakana) {
            res = replaceKatakana(res)
        }
        console.log('load niconico(', len(res), ')')
        lNicoDanmu = res
    }
    return [lNicoDanmu, lbahadanmu]
}

main()





