/******************************************
 * 参考：
 * @name 网上国网小组件数据更新接口
 * @description 网上国网电费查询
 * @channel https://t.me/yqc_123/
 * @feedback https://t.me/NobyDa_Chat
 * @author 小白脸|𝐎𝐍𝐙𝟑𝐕
 * 
 * @description 借用 @Yuheng0101 大佬脚本更改，调整了接口返回的内容，增加去年的用电量
 * 
BoxJs订阅地址:
https://raw.githubusercontent.com/Yuheng0101/X/main/Tasks/boxjs.json

#!name =网上国网
#!category=Scriptable重写
#!desc=95598 

[Script]
接口重写 = type=http-request, pattern=^https?:\/\/api\.wsgw-rewrite\.com\/electricity\/bill\/all, script-path=https://raw.githubusercontent.com/dompling/Script/master/wsgw/index.js, requires-body=true, max-size=-1, timeout=60

[MITM]
hostname = %APPEND% api.wsgw-rewrite.com


******************************************/
function getUrlParams(url) {
  const queryString = url.split("?")[1];
  if (!queryString) return {};
  const query = queryString.split("&");
  let params = {};
  for (let i = 0; i < query.length; i++) {
    let pair = query[i].split("=");
    let key = decodeURIComponent(pair[0]);
    let value = decodeURIComponent(pair[1] || "");
    params[key] = value;
  }
  return params;
}

const getEnv = () =>
    "undefined" != typeof $environment && $environment["surge-version"]
      ? "Surge"
      : "undefined" != typeof $environment && $environment["stash-version"]
      ? "Stash"
      : eval('typeof process !== "undefined"')
      ? "Node.js"
      : "undefined" != typeof $task
      ? "Quantumult X"
      : "undefined" != typeof $loon
      ? "Loon"
      : "undefined" != typeof $rocket
      ? "Shadowrocket"
      : void 0,
  isQuanX = () => "Quantumult X" === getEnv(),
  isLoon = () => "Loon" === getEnv(),
  isStash = () => "Stash" === getEnv(),
  isNode = () => "Node.js" === getEnv();
class Logger {
  constructor(e = "日志输出", o = "info") {
    (this.prefix = e),
      (this.levels = ["trace", "debug", "info", "warn", "error"]),
      this.setLevel(o);
  }
  setLevel(e) {
    this.currentLevelIndex = this.levels.indexOf(e);
  }
  log(e, ...o) {
    this.levels.indexOf(e) >= this.currentLevelIndex &&
      console.log(
        `${this.prefix ? `[${this.prefix}] ` : ""}[${e.toUpperCase()}]\n` +
          [...o].join("\n")
      );
  }
  trace(...e) {
    this.log("trace", ...e);
  }
  debug(...e) {
    this.log("debug", ...e);
  }
  info(...e) {
    this.log("info", ...e);
  }
  warn(...e) {
    this.log("warn", ...e);
  }
  error(...e) {
    this.log("error", ...e);
  }
}
const request$1 = async (request = {} || "", option = {}) => {
  switch (request.constructor) {
    case Object:
      request = { ...request, ...option };
      break;
    case String:
      request = { url: request, ...option };
  }
  request.method ||
    ((request.method = "GET"),
    (request.body ?? request.bodyBytes) && (request.method = "POST")),
    delete request.headers?.["Content-Length"],
    delete request.headers?.["content-length"];
  const method = request.method.toLocaleLowerCase();
  switch (getEnv()) {
    case "Loon":
    case "Surge":
    case "Stash":
    case "Shadowrocket":
    default:
      return (
        delete request.id,
        request.policy &&
          (isLoon() && (request.node = request.policy),
          isStash() &&
            (request.headers || (request.headers = {}),
            (request.headers["X-Stash-Selected-Proxy"] = encodeURI(
              request.policy
            )))),
        ArrayBuffer.isView(request.body) && (request["binary-mode"] = !0),
        await new Promise((e, o) => {
          $httpClient[method](request, (r, s, n) => {
            r
              ? o(r)
              : ((s.ok = /^2\d\d$/.test(s.status)),
                (s.statusCode = s.status),
                n &&
                  ((s.body = n),
                  1 == request["binary-mode"] && (s.bodyBytes = n)),
                e(s));
          });
        })
      );
    case "Quantumult X":
      switch (
        (delete request.scheme,
        delete request.sessionIndex,
        delete request.charset,
        request.policy &&
          (request.opts || (request.opts = {}),
          (request.opts.policy = request.policy)),
        (
          request?.headers?.["Content-Type"] ??
          request?.headers?.["content-type"]
        )?.split(";")?.[0])
      ) {
        default:
          delete request.bodyBytes;
          break;
        case "application/protobuf":
        case "application/x-protobuf":
        case "application/vnd.google.protobuf":
        case "application/grpc":
        case "application/grpc+proto":
        case "application/octet-stream":
          delete request.body,
            ArrayBuffer.isView(request.bodyBytes) &&
              (request.bodyBytes = request.bodyBytes.buffer.slice(
                request.bodyBytes.byteOffset,
                request.bodyBytes.byteLength + request.bodyBytes.byteOffset
              ));
        case void 0:
      }
      return await $task.fetch(request).then(
        (e) => (
          (e.ok = /^2\d\d$/.test(e.statusCode)), (e.status = e.statusCode), e
        ),
        (e) => Promise.reject(e.error)
      );
    case "Node.js":
      const got = eval('require("got")');
      let iconv = eval('require("iconv-lite")');
      const { url: url, ...option } = request;
      return await got[method](url, option).then(
        (e) => (
          (e.statusCode = e.status),
          (e.body = iconv.decode(e.rawBody, request?.encoding || "utf-8")),
          (e.bodyBytes = e.rawBody),
          e
        ),
        (e) => {
          if (e.response && 500 === e.response.statusCode)
            return Promise.reject(e.response.body);
          Promise.reject(e.message);
        }
      );
  }
};
class Store {
  constructor(NAMESPACE) {
    if (
      ((this.env = getEnv()),
      (this.Store = "./store"),
      NAMESPACE && (this.Store = `./store/${NAMESPACE}`),
      "Node.js" === this.env)
    ) {
      const { LocalStorage: LocalStorage } = eval(
        'require("node-localstorage")'
      );
      this.localStorage = new LocalStorage(this.Store);
    }
  }
  get(e) {
    switch (this.env) {
      case "Surge":
      case "Loon":
      case "Stash":
      case "Shadowrocket":
        return $persistentStore.read(e);
      case "Quantumult X":
        return $prefs.valueForKey(e);
      case "Node.js":
        return this.localStorage.getItem(e);
      default:
        return null;
    }
  }
  set(e, o) {
    switch (this.env) {
      case "Surge":
      case "Loon":
      case "Stash":
      case "Shadowrocket":
        return $persistentStore.write(o, e);
      case "Quantumult X":
        return $prefs.setValueForKey(o, e);
      case "Node.js":
        return this.localStorage.setItem(e, o), !0;
      default:
        return null;
    }
  }
  clear(e) {
    switch (this.env) {
      case "Surge":
      case "Loon":
      case "Stash":
      case "Shadowrocket":
        return $persistentStore.write(null, e);
      case "Quantumult X":
        return $prefs.removeValueForKey(e);
      case "Node.js":
        return this.localStorage.removeItem(e), !0;
      default:
        return null;
    }
  }
}
const notify = (e = "", o = "", r = "", s = {}) => {
    const n = (e) => {
      const { $open: o, $copy: r, $media: s, $mediaMime: n } = e;
      switch (typeof e) {
        case void 0:
          return e;
        case "string":
          switch (getEnv()) {
            case "Surge":
            case "Stash":
            default:
              return { url: e };
            case "Loon":
            case "Shadowrocket":
              return e;
            case "Quantumult X":
              return { "open-url": e };
            case "Node.js":
              return;
          }
        case "object":
          switch (getEnv()) {
            case "Surge":
            case "Stash":
            case "Shadowrocket":
            default: {
              const c = {};
              let t = e.openUrl || e.url || e["open-url"] || o;
              t && Object.assign(c, { action: "open-url", url: t });
              let a = e["update-pasteboard"] || e.updatePasteboard || r;
              if (
                (a && Object.assign(c, { action: "clipboard", text: a }), s)
              ) {
                let e, o, r;
                if (s.startsWith("http")) e = s;
                else if (s.startsWith("data:")) {
                  const [e] = s.split(";"),
                    [, n] = s.split(",");
                  (o = n), (r = e.replace("data:", ""));
                } else {
                  (o = s),
                    (r = ((e) => {
                      const o = {
                        JVBERi0: "application/pdf",
                        R0lGODdh: "image/gif",
                        R0lGODlh: "image/gif",
                        iVBORw0KGgo: "image/png",
                        "/9j/": "image/jpg",
                      };
                      for (var r in o) if (0 === e.indexOf(r)) return o[r];
                      return null;
                    })(s));
                }
                Object.assign(c, {
                  "media-url": e,
                  "media-base64": o,
                  "media-base64-mime": n ?? r,
                });
              }
              return (
                Object.assign(c, {
                  "auto-dismiss": e["auto-dismiss"],
                  sound: e.sound,
                }),
                c
              );
            }
            case "Loon": {
              const r = {};
              let n = e.openUrl || e.url || e["open-url"] || o;
              n && Object.assign(r, { openUrl: n });
              let c = e.mediaUrl || e["media-url"];
              return (
                s?.startsWith("http") && (c = s),
                c && Object.assign(r, { mediaUrl: c }),
                console.log(JSON.stringify(r)),
                r
              );
            }
            case "Quantumult X": {
              const n = {};
              let c = e["open-url"] || e.url || e.openUrl || o;
              c && Object.assign(n, { "open-url": c });
              let t = e["media-url"] || e.mediaUrl;
              s?.startsWith("http") && (t = s),
                t && Object.assign(n, { "media-url": t });
              let a = e["update-pasteboard"] || e.updatePasteboard || r;
              return (
                a && Object.assign(n, { "update-pasteboard": a }),
                console.log(JSON.stringify(n)),
                n
              );
            }
            case "Node.js":
              return;
          }
        default:
          return;
      }
    };
    switch (getEnv()) {
      case "Surge":
      case "Loon":
      case "Stash":
      case "Shadowrocket":
      default:
        $notification.post(e, o, r, n(s));
        break;
      case "Quantumult X":
        $notify(e, o, r, n(s));
      case "Node.js":
    }
    let c = ["", "==============📣系统通知📣=============="];
    c.push(e), o && c.push(o), r && c.push(r), console.log(c.join("\n"));
  },
  done = (e = {}) => {
    switch (getEnv()) {
      case "Surge":
      case "Loon":
      case "Stash":
      case "Shadowrocket":
      case "Quantumult X":
      default:
        $done(e);
        break;
      case "Node.js":
        process.exit(1);
    }
  },
  SERVER_HOST = "https://api.120399.xyz",
  BASE_URL = "https://www.95598.cn",
  request = async (e) => {
    try {
      const o = {
          url: `${SERVER_HOST}/wsgw/encrypt`,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ yuheng: e }),
        },
        r = await Encrypt(o);
      if ("/api/oauth2/oauth/authorize" === e.url)
        Object.assign(r, { body: r.body.replace(/^\"|\"$/g, "") });
      let { body: s } = await request$1(r);
      try {
        s = JSON.parse(s);
      } catch {}
      if (
        s.code &&
        (10010 == s.code ||
          (10002 === s.code && "WEB渠道KeyCode已失效" == s.message) ||
          30010 === s.code ||
          "20103" === s.code ||
          (10002 === s.code && bizrt.token && "Token 为空！" == s.message))
      )
        return Promise.reject(s.message);
      const n = { config: { ...e }, data: s };
      if ("/api/oauth2/outer/c02/f02" === e.url)
        Object.assign(n.config, { headers: { encryptKey: r.encryptKey } });
      const c = {
        url: `${SERVER_HOST}/wsgw/decrypt`,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ yuheng: n }),
      };
      return await Decrypt(c);
    } catch (e) {
      return Promise.reject(e);
    }
  },
  Encrypt = async (e) =>
    request$1(e).then(({ body: e }) => {
      try {
        e = JSON.parse(e);
      } catch {}
      return (
        (e.data.url = BASE_URL + e.data.url),
        (e.data.body = JSON.stringify(e.data.data)),
        delete e.data.data,
        e.data
      );
    }),
  Decrypt = async (e) =>
    request$1(e).then(({ body: o }) => {
      let r = JSON.parse(o);
      const { code: s, message: n, data: c } = r.data;
      return "" + s == "1"
        ? c
        : e.url.indexOf("oauth2/oauth/authorize") > -1 &&
          c &&
          s &&
          "" != s &&
          (10015 === s ||
            10108 === s ||
            10009 === s ||
            10207 === s ||
            10005 === s ||
            10010 === s ||
            30010 === s ||
            (10002 === s && "WEB渠道KeyCode已失效" == n) ||
            (10002 === s && bizrt.token && "Token 为空！" == n))
        ? Promise.reject(`重新获取: ${n}`)
        : Promise.reject(n);
    }),
  Recoginze = async (e) => {
    const o = {
      url: `${SERVER_HOST}/wsgw/get_x`,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ yuheng: e }),
    };
    return request$1(o).then(({ body: e }) => JSON.parse(e));
  },
  getBeforeDate = (e) => {
    const o = new Date();
    o.setDate(o.getDate() - e);
    return `${o.getFullYear()}-${String(o.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(o.getDate()).padStart(2, "0")}`;
  },
  jsonParse = (e) => {
    try {
      return JSON.parse(e);
    } catch {
      return e;
    }
  },
  jsonStr = (e, ...o) => {
    try {
      return JSON.stringify(e, ...o);
    } catch {
      return e;
    }
  },
  isTrue = (e) => !0 === e || "true" === e || 1 === e || "1" === e,
  $api = {
    getKeyCode: "/oauth2/outer/c02/f02",
    getAuth: "/oauth2/oauth/authorize",
    getWebToken: "/oauth2/outer/getWebToken",
    getRoutes: "/osg-web0004/open/c7/f01",
    searchMenu: "/osg-web0004/open/c2/f02",
    contentSearch: "/osg-web0004/open/c4/f05",
    shouyequery: "/osg-web0004/member/c4/f08",
    seachOrgNo: "/osg-open-om0001/member/c13/f05",
    detailpcut: "/osg-open-mce0001/member/c4/f06",
    login: "/osg-open-uc0001/member/c8/f23",
    loginout: "/osg-open-uc0001/member/c8/f2311111",
    tokenlogin: "/osg-open-uc0001/member/c8/f01",
    seachMsgEs: "/osg-web0004/open/c4/f03",
    orderEmail: "/osg-open-bc0001/member/c02/f04",
    LowelectBill: "/osg-open-bc0001/member/c04/f01",
    HideelectBill: "/osg-open-bc0001/member/c04/f02",
    quantity: "/osg-open-bc0001/member/c01/f01",
    searchProgress: "/osg-open-uc0001/member/c6/f06",
    Urge: "/osg-open-woc0001/member/c5/f06",
    fileLists: "/osg-open-woc0001/member/c27/f01",
    fileLists2: "/osg-open-woc0001/member/c5/f07",
    fileLists3: "/osg-open-woc0001/member/c5/f08",
    realType: "/osg-open-uc0001/member/c7/f01",
    paymentRecord: "/osg-open-bc0001/member/c03/f12",
    power: "/osg-omgmt0005/member/c9/f30",
    accountInfo: "/osg-open-uc0001/member/c4/f01",
    address: "/osg-open-om0001/member/c72/f01",
    CheckBillAmount: "/osg-open-bc0001/member/c03/f07",
    vatname: "/osg-open-uc0001/member/c4/f02",
    fgd_Submit: "/osg-open-woc0001/member/c4/f09",
    fgd_appraise: "/osg-open-woc0001/member/c27/f07",
    shouye: "/osg-web0004/open/c1/f01",
    captcha: "/osg-web0004/open/c15/f01",
    login: "/osg-open-uc0001/member/c8/f23",
    captchaPassword: "/osg-web0004/open/c15/f03",
    getCode2: "/osg-web0004/open/c50/f02",
    getCode: "/osg-open-uc0001/member/c8/f24",
    clickCard: "/osg-web0004/open/c44/f07",
    useTokenGetInfo: "/osg-uc0013/member/c4/f04",
    tokenGetUserInfo: "/osg-open-uc0001/member/c8/f56",
    getQCodeNew: "/osg-open-uc0001/member/c8/f31",
    checkQCode: "/osg-open-uc0001/member/c8/f32",
    qcodeCallback: "/osg-open-uc0001/member/c8/f33",
    content: "/osg-web0004/open/c4/f01",
    menu: "/osg-web0004/open/c2/f01",
    indexPage: "/osg-web0004/open/c1/f01",
    newsList: "/osg-open-mce0001/member/c4/f01",
    delMsg: "/osg-open-mce0001/member/c4/f05",
    codeLogin: "/osg-open-uc0001/member/c8/f22",
    codeLoginApi: "/osg-uc0013/member/c4/f02",
    reg: "/osg-open-uc0001/member/c8/f25",
    dianfeiList: "/osg-open-bc0001/member/c01/f02",
    changePassword: "/osg-open-uc0001/member/c8/f06",
    Presubmission: "/osg-open-woc0001/member/c4/f03",
    messageList: "/osg-open-uc0001/member/c13/f01",
    newMessageList: "/osg-web0004/member/c15/f06",
    forgetPass: "/osg-open-uc0001/member/c8/f06",
    sendCode: "/osg-open-uc0001/member/c8/f04",
    checkCode: "/osg-open-uc0001/member/c8/f05",
    resetPass: "/osg-open-uc0001/member/c8/f07",
    submitHouse: "/osg-open-uc0001/member/c5/f04",
    bindholds: "/osg-open-uc0001/member/c14/f02",
    getBindDoorCity: "/osg-open-om0001/member/arg/020390006",
    hadList: "/osg-open-uc0001/member/c9/f02",
    holdList: "/osg-open-uc0001/member/c9/f03",
    wantbindhold: "/osg-open-uc0001/member/c9/f04",
    holdsign: "/osg-open-uc0001/member/c9/f07",
    Mainhold: "/osg-open-uc0001/member/c9/f05",
    untying: "/osg-open-uc0001/member/c14/f03",
    holdCert: "/osg-open-uc0001/member/c5/f02",
    onSite: "/osg-open-woc0001/member/c27/f20",
    subJudge: "/osg-open-sfan0001/member/c4/f01",
    getevalMsg: "/osg-open-om0001/member/c8/f02",
    getVCommit: "/osg-open-sfan0001/member/c4/f02",
    pauseSCode: "/osg-open-woc0001/member/c27/f30",
    newSCode: "/osg-web0004/member/c15/f05",
    pauseTCode: "/osg-open-woc0001/member/c27/f24",
    giveHome: "/osg-open-woc0001/member/c4/f13",
    reName: "/osg-open-woc0001/member/c4/f12",
    uploadPic: "/osg-open-scp0001/member/c5/f05",
    uploadAuthPic: "/osg-open-scp0001/member/c5/f07",
    invoiceList: "/osg-open-bc0001/member/c02/f01",
    operaLis: "/osg-open-bc0001/member/c02/f03",
    kpdetailsLis: "/osg-open-bc0001/member/c02/f02",
    unread: "/osg-open-mce0001/member/c4/f02",
    readAllMsg: "/osg-open-mce0001/member/c4/f07",
    markRead: "/osg-open-mce0001/member/arg/010410001",
    newsdetails: "/osg-open-mce0001/member/c4/f04",
    newsdelete: "/osg-open-mce0001/member/c4/f05",
    pay: "/osg-wp0004/member/payment/getPayMethodList",
    createOrder: "/osg-wp0002/member/charge/createOrder",
    invokey: "/osg-wp0002/member/charge/invokePay",
    surplus: "/osg-wp0002/member/charge/getElecUserChargeList",
    orderStatus: "/osg-wp0002/member/charge/getOrderHeaderStatus",
    reCardVer: "/osg-wp0002/member/charge/checkRechargeUser",
    reCardRecharge: "/osg-wp0002/member/charge/rechargeCard",
    searchUser: "/osg-open-uc0001/member/c9/f02",
    send: "/osg-open-uc0001/member/c8/f04",
    code: "/osg-open-uc0001/member/c8/f05",
    electBill: "/osg-open-bc0001/member/c04/f03",
    segmentDate: "/osg-open-bc0001/member/arg/020070013",
    Progress: "/osg-web0004/member/c18/f01",
    searchProgress2: "/osg-open-uc0001/member/c6/f07",
    lookMore: "/osg-open-uc0001/member/c6/f02",
    gdAnniu: "/osg-open-woc0001/member/c27/f19",
    deleteProgress: "/osg-open-uc0001/member/c6/f05",
    dataList: "osg-open-woc0001/member/c27/f16",
    dataList2: "osg-open-woc0001/member/c27/f17",
    getData: "/osg-open-woc0001/member/c27/f28",
    getOtherData: "/osg-open-woc0001/member/arg/020370031",
    startData: "/osg-open-woc0001/member/c27/f27",
    complaintsubmit: "/osg-open-woc0001/member/c5/f00",
    reportsubmit: "/osg-open-woc0001/member/c5/f01",
    professionsubmit: "/osg-open-woc0001/member/c5/f02",
    havesaysubmit: "/osg-open-woc0001/member/c5/f03",
    faultrepairsubmit: "/osg-open-woc0001/member/c5/f04",
    faultrepair: "/osg-open-om0001/member/c72/f02",
    idauthen: "/osg-open-woc0001/member/c27/f26",
    companySub: "/osg-open-woc0001/member/c4/f07",
    increaseSub: "/osg-open-woc0001/member/c4/f10",
    subzj: "/osg-open-woc0001/member/c4/f06",
    order: "/osg-open-scp0001/member/c4/f01",
    vatchang: "/osg-open-woc0001/member/c4/f17",
    doorNumber: "/osg-open-uc0001/member/c9/f02",
    setMainDoor: "/osg-open-uc0001/member/c9/f05",
    queryAbleBindDoorNumber: "/osg-open-uc0001/member/c9/f03",
    identitySubmit: "/osg-open-uc0001/member/c8/f02",
    listconsumers: "/osg-open-uc0001/member/c6/f03",
    delListconsumers: "/osg-open-uc0001/member/arg/020360024",
    listconsumers_Progress: "/osg-open-uc0001/member/c6/f01",
    stopCapacity: "/osg-open-woc0001/member/c4/f01",
    lessCapacity: "/osg-open-woc0001/member/c4/f02",
    personageApi: "/osg-open-woc0001/member/c4/f11",
    newHouseholdElectricity: "/osg-open-woc0001/member/c4/f08",
    certificationSearchFinal: "/osg-open-uc0001/member/c8/f11",
    identitymap: "/osg-open-uc0001/member/c8/f08",
    OCR: "/osg-open-uc0001/member/c8/f09",
    adFlag: "/osg-open-uc0001/member/c14/f01",
    meterCalibration: "/osg-open-woc0001/member/c4/f05",
    meteringPoint: "/osg-open-uc0001/member/c6/f11",
    transformer: "/osg-open-uc0001/member/c6/f08",
    powerSupply: "/osg-open-uc0001/member/c6/f10",
    updateUserInfo: "/osg-open-uc0001/member/c8/f03",
    updateAccount: "/osg-open-uc0001/member/c8/f26",
    userInfo: "/osg-open-uc0001/member/c8/f01",
    pauseSub: "/osg-open-woc0001/member/c4/f15",
    reduceSub: "/osg-open-woc0001/member/c4/f16",
    infoSupplement: "/osg-open-woc0001/member/c27/f25",
    electricityPriceStrategyChange: "/osg-open-woc0001/member/arg/030340052",
    subscriptionList: "/osg-open-mce0001/member/c7/f00",
    participate: "/osg-open-mce0001/member/c05/f04",
    fuzzySearch: "/osg-open-uc0001/member/c4/f04",
    downloadImg: "/osg-open-scp0001/member/c5/f02",
    tokendownloadImg: "/osg-open-uc0001/member/c8/f72",
    eemandValueAdjustment: "/osg-open-woc0001/member/c4/f14",
    oneOffice: "/osg-open-scp0001/member/c4/f02",
    ceshi: "/osg-rm0001/member/c1/f05",
    InformationConfirmation: "/osg-open-woc0001/member/c27/f21",
    vatlist: "/osg-open-om0001/member/c72/f03",
    payAmtList: "/osg-web0004/member/c77/f01",
    accapi: "/osg-open-bc0001/member/c05/f01",
    chergileApi: "/osg-open-woc0001/member/c4/f04",
    otherApi: "/osg-open-woc0001/member/c27/f40",
    demographicStatus: "/osg-open-sfan0001/member/c5/f01",
    demoGraphicChecks: "/osg-open-sfan0001/member/c5/f03",
    subDemoGraphic: "/osg-woc0001/member/c72/f01",
    checkHomeApi: "/osg-open-sfan0001/member/c5/f02",
    biaojiDanHao: "/osg-open-uc0001/member/c6/f09",
    electTrend: "/osg-open-bc0001/member/c03/f14",
    dayElectLoad: "/osg-open-bc0001/member/c03/f05",
    electLoadTrend: "/osg-open-bc0001/member/c03/f06",
    JiFen: "/osg-open-om0001/member/c19/f01",
    JiFenYuE: "/osg-open-om0001/member/c19/f02",
    searchBankBind: "/osg-open-uc0001/member/c8/f18",
    hasBindBankAuth: "/osg-open-uc0001/member/c8/f20",
    bankAuthSendCode: "/osg-open-uc0001/member/c8/f16",
    HBankAuthCode: "/osg-open-uc0001/member/c8/f15",
    searchBankXY: "/osg-open-uc0001/member/c8/f14",
    searchIDofBank: "/osg-open-uc0001/member/c8/f13",
    searchTypeOfBank: "/osg-open-uc0001/member/c8/f12",
    boundsendver: "/osg-open-uc0001/member/c8/f21",
    friendLink: "/osg-web0004/open/c5/f01",
    getIPAddr: "/osg-web0004/open/c8/f01",
    pauseSCodeApi: "/osg-open-woc0001/member/c27/f30",
    checkCodeApi: "/osg-woc0001/member/c2/f01",
    payCodeApi: "/osg-open-uc0001/member/arg/030010192",
    empowerBindApi: "/osg-open-uc0001/member/arg/030010193",
    getAuthToken: "/osg-open-uc0001/member/arg/020360047",
    getUserInfoByAuthToken: "/osg-open-uc0001/member/arg/020360048",
    loginVerifyCode: "/osg-web0004/open/c44/f01",
    loginTestCode: "/osg-web0004/open/c44/f02",
    loginVerifyCodeNew: "/osg-web0004/open/c44/f05",
    loginTestCodeNew: "/osg-web0004/open/c44/f06",
    jsonApi: "/osg-web0004/member/c15/f01",
    getNewsApi: "/osg-web0004/open/c4/f04",
    getBankInfo: "/osg-open-uc0001/member/c8/f17",
    newsListApi: "/osg-web0004/member/c15/f02",
    StopList: "/osg-open-mce0001/member/c06/f01",
    busInfoApi: "/osg-web0004/member/c24/f01",
    getIntelligentPaymentStatus: "/osg-open-bc0001/member/arg/020070032",
    getnewPhoneCode: "/osg-web0004/member/c15/f03",
    allFileLists: "/osg-web0004/member/c24/f02",
    changePhoneGetOldCode: "/osg-web0004/member/c15/f04",
    emergencys: "/osg-open-p0001/member/c5/f03",
    theme: "/osg-web0004/open/c3/f01",
    backOrderMsg: "/osg-woc0001/member/c70/f01",
    queryCarAddress: "/osg-web0004/member/c49/f01",
    queryBoundGroupAccount: "/osg-open-uc0001/member/arg/030360248",
    queryBoundGroupSubAccount: "/osg-open-uc0001/member/arg/030360252",
    queryElectricEnterprise: "/osg-open-bc0001/member/arg/030070112",
    queryAccountNumberBoundEnterprise: "/osg-open-bc0001/member/arg/030070112",
    queryapUPConsumingEnterprises: "/osg-open-bc0001/member/arg/030070113",
    queryPowerHandlingProcess: "/osg-open-woc0001/member/arg/030010214",
    getAppaVersion: "/osg-web0004/open/c17/f01",
    homeMsgBox: "/osg-web0004/open/c18/f01",
    excludeDayCompany: "/osg-open-bc0001/member/c11/f04",
    excludeDayUser: "/osg-open-bc0001/member/c11/f03",
    excludeMonthCompany: "/osg-open-bc0001/member/c11/f02",
    excludeMonthUser: "/osg-open-bc0001/member/c11/f01",
    eleMonthForecast: "/osg-open-bc0001/member/c11/f00",
    eleMonthRange: "/osg-open-bc0001/member/c10/f14",
    eleMonthRangePermit: "/osg-open-bc0001/member/c10/f16",
    eleDayRange: "/osg-open-bc0001/member/c10/f17",
    eleDayRangePermit: "/osg-open-bc0001/member/c10/f19",
    ListAgentUsersElectricitySellingE: "/osg-open-uc0001/member/c9/f11",
    ListAuthorizeUsersElectricitySellingE: "/osg-open-sfan0001/member/c8/f03",
    BoundEnterpriseQuery: "/osg-open-uc0001/member/c9/f14",
    eleMonthThb: "/osg-open-bc0001/member/c10/f14",
    eleApplyCount: "/osg-open-bc0001/member/c11/f27",
    eleApplyCountChart: "/osg-open-bc0001/member/c11/f28",
    applyList: "/osg-open-bc0001/member/c11/f29",
    unApplyList: "/osg-open-bc0001/member/c11/f30",
    sendMessageByBatch: "/osg-open-bc0001/member/c11/f32",
    sendMessageByOne: "/osg-open-bc0001/member/c11/f31",
    exportApplyedData: "/osg-open-bc0001/member/c11/f56",
    priceDeviationData: "/osg-open-bc0001/member/c11/f52",
    priceDeviationTimeType: "/osg-open-bc0001/member/c11/f47",
    priceClearingCount: "/osg-open-bc0001/member/c11/f41",
    priceClearingList: "/osg-open-bc0001/member/c11/f42",
    priceClearingDelete: "/osg-open-bc0001/member/c11/f45",
    priceClearingDetail: "/osg-open-bc0001/member/c11/f43",
    priceClearingUpdate: "/osg-open-bc0001/member/c11/f44",
    priceClearingImportExcel: "/osg-open-bc0001/member/c11/f46",
    getMetaRegionByFullId: "/osg-open-bc0001/member/c11/f48",
    getElecList: "/osg-open-bc0001/member/c11/f13",
    electDelete: "/osg-open-bc0001/member/c11/f15",
    electDetails: "/osg-open-bc0001/member/c11/f14",
    electSave: "/osg-open-bc0001/member/c11/f16",
    applyPageList: "/osg-open-bc0001/member/c11/f49",
    applyPageCount: "/tradeApplyCaseRq/findApplyCaseRqCount",
    applyCaseRqDetail: " /osg-open-bc0001/member/c11/f50",
    applyCaseRqList: "/osg-open-bc0001/member/c11/f51",
    applyCaseRqSave: "/osg-open-bc0001/member/c11/f53",
    applyCaseRqDel: "/osg-open-bc0001/member/c11/f54",
    doHourCompanyFourcast: "/osg-open-bc0001/member/c11/f06",
    doSaveHourFourcast: " /osg-open-bc0001/member/c11/f07",
    getHourFourcastTasklist: "/osg-open-bc0001/member/c11/f08",
    getHourFourcastResultOneday: "/osg-open-bc0001/member/c11/f55",
    getHourFourcastResultByRefId: "/osg-open-bc0001/member/c11/f10",
    deleteHourFourcastResultByRefId: "/osg-open-bc0001/member/c11/f11",
    getDivisionByProviceCode: "/osg-open-bc0001/member/c11/f12",
    tCsaveTrade: "/osg-open-bc0001/member/c11/f33",
    tCsetMealList: "/osg-open-bc0001/member/c11/f34",
    tCdeleteOneById: "/osg-open-bc0001/member/c11/f35",
    tCgetTcDetailListByTcId: "/osg-open-bc0001/member/c11/f38",
    eleApplyList: "/osg-open-bc0001/member/c11/f23",
    eleApplyOne: "/osg-open-bc0001/member/c11/f24",
    eleApplySave: "/osg-open-bc0001/member/c11/f22",
    eleApplyModify: "/osg-open-bc0001/member/c11/f26",
    priceCatPrcQueryBySecNoAndProvince: "/osg-open-bc0001/member/c11/f20",
    priceCatPrcSave: "/osg-open-bc0001/member/c11/f21",
    priceCatPrcQueryForecastData: "/osg-open-bc0001/member/c11/f18",
    priceCatPrcGetBySecNo: "/osg-open-bc0001/member/c11/f17",
    priceCatPrcQueryElecHourData: "/osg-open-bc0001/member/c11/f19",
    applyDeviAnalyQuery: "/osg-open-bc0001/member/c11/f05",
    goodsSaveData: "/osg-open-bc0001/member/arg/030070085",
    goodsqueryList: "/osg-open-bc0001/member/arg/030070086",
    getDataByGoodsId: "/osg-open-bc0001/member/arg/030070087",
    goodsDelete: "/osg-open-bc0001/member/arg/030070088",
    goodsUpShelf: "/osg-open-bc0001/member/arg/030070089",
    goodsOffShelf: "/osg-open-bc0001/member/arg/030070090",
    goodsUploadFile: "/osg-open-bc0001/member/c11/f57",
    goodsDownloadFile: "/osg-open-bc0001/member/c11/f59",
    uploadFile: "/osg-open-bc0001/member/c11/f57",
    fileList: "/osg-open-bc0001/member/arg/030070083",
    downloadFileList: "/osg-open-bc0001/member/c11/f59",
    downloadFile: "/osg-open-bc0001/member/c11/f58",
    deleteFileById: "/osg-open-bc0001/member/arg/030070084",
    ordersList: "/osg-open-bc0001/member/arg/030210002",
    ordersDetail: "/osg-open-bc0001/member/arg/030070100",
    saveHtMain: "/osg-open-bc0001/member/arg/030070101",
    queryHtMainByOrderId: "/osg-open-bc0001/member/arg/030070102",
    comboOrdersApplyCancel: "/osg-open-bc0001/member/arg/030070092",
    comboOrdersConfirmCancel: "/osg-open-bc0001/member/arg/030070093",
    getFavList: "/osg-open-bc0001/member/arg/030070081",
    cancelFav: "/osg-open-bc0001/member/arg/030070080",
    saveFav: "/osg-open-bc0001/member/arg/030070079",
    ifFav: "/osg-open-bc0001/member/arg/030070082",
    queryEnquiryPageList: "/osg-open-bc0001/member/arg/030070095",
    goodsEnquirySaveData: "/osg-open-bc0001/member/arg/030070094",
    saveReplyEnquiryData: "/osg-open-bc0001/member/arg/030070099",
    goodsEnquiryList: "/osg-open-bc0001/member/arg/030070095",
    goodsComboordersCreate: "/osg-open-bc0001/member/arg/030070091",
    goodsComboordersJudgeQualifications:
      "/osg-open-bc0001/member/arg/030070098",
    goodsEnquiryOfferPriceJudge: "/osg-open-bc0001/member/arg/030070096",
    goodsEnquiryOfferPrice: "/osg-open-bc0001/member/arg/030070097",
    goodsEnquiryOffShelf: "/osg-open-bc0001/member/arg/030070105",
    queryDataListByEnquiryVo: "/osg-open-bc0001/member/arg/030070106",
    queryEnquiryListPage: "/osg-open-bc0001/member/arg/030070107",
    saveBackEnquiryData: "/osg-open-bc0001/member/arg/030070108",
    enquiryOrdersApplyCancel: "/osg-open-bc0001/member/arg/030070109",
    enquiryOrdersConfirmCancel: "/osg-open-bc0001/member/arg/030070110",
    saveFiles: "/osg-open-bc0001/member/arg/030070111",
    BindingOfElectricitySellingEnterprises: "/osg-open-uc0001/member/c9/f24",
    BindEnterprise: "/osg-open-uc0001/member/c8/f60",
    BoundEnterpriseQuery: "/osg-open-uc0001/member/c9/f14",
    ListAgentUsersElectricitySellingE: "/osg-open-uc0001/member/c9/f11",
    getSDCode: "/osg-open-uc0001/member/c8/f04",
    excludeDayCompany: "/osg-open-bc0001/member/c11/f04",
    excludeDayUser: "/osg-open-bc0001/member/c11/f03",
    excludeMonthCompany: "/osg-open-bc0001/member/c11/f02",
    excludeMonthUser: "/osg-open-bc0001/member/c11/f01",
    queryHandlerManagement: "/osg-open-sfan0001/member/arg/030330101",
    handlerPhoneCheck: "/osg-open-sfan0001/member/arg/030330102",
    getBindHandlerCode: "/osg-open-uc0001/member/arg/030360273",
    cancelHandlerBind: "/osg-open-sfan0001/member/arg/030330103",
    infoPublic: "/osg-omgmt1015/content/c01/f52",
    electrovalenceStandard: "/osg-omgmt1030/priceinfo/c01/f04",
    electrovalenceType: "/osg-omgmt1030/priceinfo/c01/f05",
    classicCase: "/osg-omgmt1030/content/c01/f52",
    uploadfile: "/osg-scp0002/member/c2/f03",
    dispute: "/osg-open-woc0001/member/c27/f52",
    disputeDetail: "/osg-open-woc0001/member/c27/f53",
    selldispite: "/osg-open-woc0001/member/c27/f51",
    information: "/osg-open-om0001/member/c16/f02",
    informationList: "/osg-open-om0001/member/c16/f03",
    searchKeyWords: "/osg-open-om0001/member/arg/020390035",
    searchKeyWordsInfo: "emss-pfa-pro-front/app_api/selectNewChannelist",
    billingService: "/osg-open-bc0001/member/c10/f01",
    monthSearch: "/osg-open-bc0001/member/c03/f15",
    dataSearch: "/osg-open-bc0001/member/c03/f16",
    pointSearch: "/osg-open-bc0001/member/c03/f17",
    indicatSearch: "/osg-open-bc0001/member/c03/f18",
    indicatPost: "/osg-open-bc0001/member/c03/f19",
    querySuperAdministrator: "/osg-open-sfan0001/member/arg/030010096",
    applySuperAdministrator: "/osg-open-sfan0001/member/arg/030330099",
    getApplicationRecord: "/osg-open-sfan0001/member/arg/030330100",
    fileUpload: "/osg-open-sfan0001/member/arg/030010098",
    fileDownload: "/osg-open-sfan0001/member/arg/030010097",
    querySellerPageList: "/osg-open-sfan0001/member/arg/030010182",
    querySettlePageList: "/osg-open-sfan0001/member/arg/030010183",
    elecYdPuPageList: "/osg-open-sfan0001/member/arg/030010178",
    elecYdPuConfirm: "/osg-open-sfan0001/member/arg/030010179",
    elecYdPuExport: "/saler/dldl/export",
    elecSbFdSaveSwdl: "/osg-open-sfan0001/member/arg/030010180",
    elecSbFdGetSwdl: "/osg-open-sfan0001/member/arg/030010181",
    salerDldjPageList: "/osg-open-sfan0001/member/arg/030010173",
    salerDldjConfirm: "/osg-open-sfan0001/member/arg/030010174",
    salerDldjSave: "/osg-open-sfan0001/member/arg/030010175",
    salerDldjImport: "/osg-open-sfan0001/member/arg/030010176",
    salerDldjExport: "/osg-open-sfan0001/member/arg/030010177",
    unbindPowerGenerationEnterprise: "/osg-open-uc0001/member/arg/030360278",
    queryPowerGenerationEnterpriseList: "/osg-open-uc0001/member/arg/030360279",
    bindPowerGenerationEnterprise: "/osg-open-uc0001/member/arg/030360280",
    queryBoundPowerGenerationEnterpriseList:
      "/osg-open-uc0001/member/arg/030370095",
    queryPowerGenerationEnterpriseDetail:
      "/osg-open-uc0001/member/arg/030360281",
    downloadNewGenFile: "/osg-open-bc0001/member/arg/020010002",
    downloadNewGenFile: "/osg-open-bc0001/member/arg/020010002",
    unbindPowerGenerationEnterprise: "/osg-open-uc0001/member/arg/030360278",
    queryPowerGenerationEnterpriseList: "/osg-open-uc0001/member/arg/030360279",
    bindPowerGenerationEnterprise: "/osg-open-uc0001/member/arg/030360280",
    queryBoundPowerGenerationEnterpriseList:
      "/osg-open-uc0001/member/arg/030370095",
    queryPowerGenerationEnterpriseDetail:
      "/osg-open-uc0001/member/arg/030360281",
    queryMonthElec: "/osg-open-bc0001/member/arg/020010008",
    queryMonthsElec: "/osg-open-bc0001/member/arg/020010010",
    queryDayElec: "/osg-open-bc0001/member/arg/020010009",
    queryDaysElec: "/osg-open-bc0001/member/arg/020010011",
    billPageList: "/osg-open-bc0001/member/arg/020010003",
    getBillById: "/osg-open-bc0001/member/arg/020010005",
    getMonthBillByMemberID: "/osg-open-bc0001/member/arg/020010004",
    getBillSummaryData: "/osg-open-bc0001/member/arg/020010007",
    submitBillData: "/osg-open-bc0001/member/arg/020010006",
    viewBindingAccountNumber: "/osg-open-uc0001/member/c9/f22",
    highVoltageSubscriberBinding: "/osg-open-uc0001/member/arg/020210008",
    saveGfPersonal: "/osg-open-om0001/member/arg/030010195",
    saveGfEnterprise: "/osg-open-om0001/member/arg/030010196",
    getGfOwnBankList: "/osg-open-om0001/member/arg/030010203",
    getGfAgentBankList: "/osg-open-om0001/member/arg/030010201",
    getGfBankList: "/osg-open-om0001/member/arg/030010205",
    changeGfBank: "/osg-open-om0001/member/arg/030010206",
    saveGfOwnBank: "/osg-open-om0001/member/arg/030010204",
    saveGfAgentBank: "/osg-open-om0001/member/arg/030010202",
    getGfPhoneCode: "/osg-open-om0001/member/arg/030010199",
    jointBusinessQuery: "/osg-open-woc0001/member/arg/030010211",
    jointBusinessSubmit: "/osg-open-woc0001/member/arg/030010212",
    sendSMS: "/osg-open-uc0001/member/c8/f48",
    getGBServiceList: "/osg-open-uc0001/member/arg/030360295",
    checkGBAccount: "/osg-open-uc0001/member/arg/030360297",
    GBEmpowerBind: "/osg-open-uc0001/member/arg/030360296",
    getStaticLink: "/osg-open-om0001/member/c11/f07",
    getBankDatainfo: "/osg-open-sfan0001/member/arg/010210042",
    labelsAccordingColumn: "/osg-web0004/open/c20/f01",
    getOurGradesConf: "/osg-web0004/open/c19/f01",
    subscribeInvoice: "/osg-open-bc0001/member/arg/030070148",
    emailSubscribe: "/osg-open-bc0001/member/arg/030070146",
    invoiceingEle: "/osg-open-bc0001/member/arg/030070144",
    invoiceListBj: "/osg-open-bc0001/member/arg/030070142",
    invoiceListZl: "/osg-open-bc0001/member/arg/030070149",
    invoicePrivate: "/osg-open-bc0001/member/arg/020070007",
    qurGcNoListNew: "/osg-open-woc0001/member/arg/020370033",
    getConfigInfo: "/osg-open-woc0001/member/arg/020370034",
    iphoneController: "/osg-open-woc0001/member/arg/020370035",
    selectElectricity: "/osg-open-woc0001/member/arg/020370038",
    selectPayScheduleNew: "/osg-open-woc0001/member/arg/020370039",
    payMessageFeedbackNew: "/osg-open-woc0001/member/arg/020370040",
    selectActualPaymentInfo: "/osg-open-woc0001/member/arg/020370041",
  },
  $configuration = {
    uscInfo: {
      member: "0902",
      devciceIp: "",
      devciceId: "",
      tenant: "state_grid",
    },
    source: "SGAPP",
    target: "32101",
    channelCode: "0902",
    channelNo: "0902",
    toPublish: "01",
    siteId: "2012000000033700",
    srvCode: "",
    serialNo: "",
    funcCode: "",
    serviceCode: {
      order: "0101154",
      uploadPic: "0101296",
      pauseSCode: "0101250",
      pauseTCode: "0101251",
      listconsumers: "0101093",
      messageList: "0101343",
      submit: "0101003",
      sbcMsg: "0101210",
      powercut: "0104514",
      BkAuth01: "f15",
      BkAuth02: "f18",
      BkAuth03: "f02",
      BkAuth04: "f17",
      BkAuth05: "f05",
      BkAuth06: "f16",
      BkAuth07: "f01",
      BkAuth08: "f03",
    },
    electricityArchives: { servicecode: "0104505", source: "0902" },
    subscriptionList: {
      srvCode: "APP_SGPMS_05_030",
      serialNo: "22",
      channelCode: "0902",
      funcCode: "22",
      target: "-1",
    },
    userInformation: { serviceCode: "01008183", source: "SGAPP" },
    userInform: { serviceCode: "0101183", source: "SGAPP" },
    elesum: {
      channelCode: "0902",
      funcCode: "WEBALIPAY_01",
      promotCode: "1",
      promotType: "1",
      serviceCode: "0101143",
      source: "app",
    },
    account: { channelCode: "0902", funcCode: "WEBA1007200" },
    doorNumberManeger: {
      source: "0902",
      target: "-1",
      channelCode: "09",
      channelNo: "09",
      serviceCode: "01010049",
      funcCode: "WEBA40050000",
      uscInfo: {
        member: "0902",
        devciceIp: "",
        devciceId: "",
        tenant: "state_grid",
      },
    },
    doorAuth: { source: "SGAPP", serviceCode: "f04" },
    xinZ: {
      serCat: "101",
      jM_busiTypeCode: "101",
      fJ_busiTypeCode: "102",
      jM_custType: "03",
      fJ_custType: "02",
      serviceType: "01",
      subBusiTypeCode: "",
      funcCode: "WEBA10070700",
      order: "0101154",
      source: "SGAPP",
      querytypeCode: "1",
    },
    onedo: {
      serviceCode: "0101046",
      source: "SGAPP",
      funcCode: "WEBA10070700",
      queryType: "03",
    },
    xinHuTongDian: {
      serCat: "110",
      busiTypeCode: "211",
      subBusiTypeCode: "21102",
      funcCode: "WEBA10071200",
      channelCode: "0902",
      source: "09",
      serviceCode: "0101183",
    },
    company: {
      serCat: "104",
      funcCode: "WEBA10070700",
      serviceType: "02",
      querytypeCode: "1",
      authFlag: "1",
      source: "SGAPP",
      order: "0101154",
    },
    charge: {
      channelCode: "09",
      funcCode: "WEBA10071300",
      channelNo: "0901",
      serCat: "102",
      jM_custType: "01",
      jM_busiTypeCode: "102",
    },
    other: {
      channelCode: "09",
      funcCode: "WEBA10079700",
      serCat: "129",
      busiTypeCode: "999",
      subBusiTypeCode: "21501",
      serviceCode: "BCP_000026",
      srvCode: "",
      serialNo: "",
    },
    vatchange: {
      submit: "0101003",
      busiTypeCode: "320",
      subBusiTypeCode: "",
      serCat: "115",
      funcCode: "WEBA10074000",
      authFlag: "1",
    },
    bill: {
      clearCache: "1",
      funcCode: "WEBALIPAY_01",
      promotType: "1",
      serviceCode: "BCP_000026",
    },
    stepelect: {
      channelCode: "0902",
      funcCode: "WEBALIPAY_01",
      promotType: "1",
      clearCache: "09",
      serviceCode: "BCP_000026",
      source: "app",
    },
    intelligentPayment: { serviceCode: "0102719", source: "SGAPP" },
    getday: {
      channelCode: "0902",
      clearCache: "11",
      funcCode: "WEBALIPAY_01",
      promotCode: "1",
      promotType: "1",
      serviceCode: "BCP_000026",
      source: "app",
    },
    mouthOut: {
      channelCode: "0902",
      clearCache: "11",
      funcCode: "WEBALIPAY_01",
      promotCode: "1",
      promotType: "1",
      serviceCode: "BCP_000026",
      source: "app",
    },
    meter: {
      serCat: "114",
      busiTypeCode: "304",
      funcCode: "WEBA10071000",
      subBusiTypeCode: "",
      serviceCode: "0101046",
      serialNo: "",
    },
    complaint: {
      busiTypeCode: "005",
      srvMode: "0902",
      anonymousFlag: "0",
      replyMode: "01",
      retvisitFlag: "01",
    },
    report: { busiTypeCode: "006" },
    tradewinds: { busiTypeCode: "019" },
    somesay: { busiTypeCode: "091" },
    faultrepair: {
      funcCode: "WEBA10070900",
      serviceCode: "0101183",
      serCat: "111",
      busiTypeCode: "001",
      subBusiTypeCode: "21505",
    },
    electronicInvoice: { serCat: "105", busiTypeCode: "0" },
    rename: {
      serviceCode: "0101046",
      funcCode: "WEBA10076100",
      busiTypeCode: "210",
      serCat: "109",
      authFlag: "1",
      gh_busiTypeCode: "211",
      gh_subusi: "21101",
      serialNo: "",
      srvCode: "",
    },
    pause: {
      subBusiTypeCode: "",
      serviceCode: "01010049",
      funcCode: "WEBA10073600",
      serCat: "107",
      busiTypeCode: "201",
      jr_busi: "201",
      serialNo: "",
      srvCode: "",
      order: "0101154",
      source: "SGAPP",
      querytypeCode: "1",
    },
    capacityRecovery: {
      serviceCode: "01010049",
      source: "SGAPP",
      srvCode: "",
      serialNo: "",
      funcCode: "WEBA10073700",
      busiTypeCode_stop: "204",
      busiTypeCode_less: "202",
      busiTypeCode: "202",
      subBusiTypeCode: "",
      serCat: "108",
      timeDay: "5",
      authFlag: "1",
    },
    electricityPriceChange: {
      serviceCode: "0101183",
      busiTypeCode: "215",
      subBusiTypeCode: "21502",
      serCat: "113",
      authFlag: "1",
      timeDay: "15",
      funcCode: "WEBA10073900WEB",
      srvCode: "",
      serialNo: "",
    },
    electricityPriceStrategyChange: {
      serviceCode: "01008183",
      busiTypeCode: "215",
      subBusiTypeCode: "21506",
      serCat: "160",
      funcCode: "WEBV00000517WEB",
      srvCode: "",
      serialNo: "",
    },
    eemandValueAdjustment: {
      serviceCode: "0101183",
      srvCode: "",
      serialNo: "",
      serCat: "112",
      funcCode: "WEBA10073800",
      busiTypeCode: "215",
      subBusiTypeCode: "21504",
      authFlag: "1",
      timeDay: "5",
      getMonthServiceCode: "0101046",
    },
    businessProgress: {
      serviceCode: "0101183",
      srvCode: "01",
      funcCode: "WEB01",
    },
    increase: {
      source: "SGAPP",
      serialNo: "",
      srvCode: "",
      serviceCode_smt: "01010049",
      serviceCode: "0101154",
      order: "0101154",
      funcCode: "WEBA10070800",
      querytypeCode: "1",
      serCat: "106",
      busiTypeCode: "111",
      subBusiTypeCode: "",
    },
    fjincrea: {
      serCat: "105",
      busiTypeCode: "110",
      subBusiTypeCode: "",
      source: "SGAPP",
      funcCode: "WEBA10070800",
      serialNo: "",
      srvCode: "",
      serviceCode_smt: "01010049",
      serviceCode: "0101154",
      order: "0101154",
      querytypeCode: "1",
    },
    persIncrea: {
      serCat: "105",
      busiTypeCode: "109",
      order: "0101154",
      subBusiTypeCode: "",
      source: "SGAPP",
      funcCode: "WEBA10070800",
      querytypeCode: "1",
    },
    fgdChange: {
      serviceCode: "0101183",
      srvCode: "01",
      channelCode: "09",
      funcCode: "WEBA10070900",
      busiTypeCode: "215",
      subBusiTypeCode: "21505",
      serCat: "111",
      authFlag: "1",
    },
    createOrder: {
      channelCode: "0902",
      funcCode: "WEBALIPAY_01",
      srvCode: "BCP_000001",
      chargeMode: "02",
      conType: "01",
      bizTypeId: "BT_ELEC",
    },
    largePopulation: {
      busiTypeCode: "383",
      funcCode: "WEBA10076800",
      subBusiTypeCode: "",
      srvCode: "",
      promotType: "",
      promotCode: "",
      channelCode: "0901",
      serCat: "383",
      serviceCode: "",
      serialNo: "",
    },
    biaoJiCode: { serviceCode: "0104507", source: "1704", channelCode: "1704" },
    biaoJiCode: { serviceCode: "0104507", source: "1704", channelCode: "1704" },
    twoGuar: {
      busiTypeCode: "402",
      subBusiTypeCode: "40201",
      funcCode: "web_twoGuar",
    },
    electTrend: { serviceCode: "BCP_00026", channelCode: "0902" },
    emergency: {
      serviceCode: "BCP_00026",
      funcCode: "A10000000",
      channelCode: "0902",
    },
    infoPublic: { serviceCode: "2545454", source: "app" },
  },
  Notify = isNode() ? require("./sendNotify") : "",
  SCRIPTNAME = "网上国网",
  NAMESPACE = "ONZ3V",
  store = new Store(NAMESPACE),
  Global =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : {};
Global.bizrt = jsonParse(store.get("95598_bizrt")) || {};
const log = new Logger(
    SCRIPTNAME,
    isTrue(isNode() ? process.env.WSGW_LOG_DEBUG : store.get("95598_log_debug"))
      ? "debug"
      : "info"
  ),
  USERNAME =
    (isNode() ? process.env.WSGW_USERNAME : store.get("95598_username")) || "",
  PASSWORD =
    (isNode() ? process.env.WSGW_PASSWORD : store.get("95598_password")) || "";
async function getKeyCode() {
  console.log("⏳ 获取keyCode和publicKey...");
  try {
    const e = { url: `/api${$api.getKeyCode}`, method: "post", headers: {} };
    (Global.requestKey = await request(e)),
      log.info("✅ 获取keyCode和publicKey成功"),
      log.debug(`🔑 keyCode&publicKey: ${jsonStr(requestKey, null, 2)}`);
  } catch (e) {
    return Promise.reject(`获取keyCode和PublicKey失败: ${e}`);
  } finally {
    console.log("🔚 获取keyCode和publicKey结束");
  }
}
async function getVerifyCode() {
  console.log("⏳ 获取验证码...");
  try {
    const e = {
        url: `/api${$api.loginVerifyCodeNew}`,
        method: "post",
        data: {
          password: PASSWORD,
          account: USERNAME,
          canvasHeight: 200,
          canvasWidth: 310,
        },
        headers: { ...requestKey },
      },
      o = await request(e);
    log.info("✅ 获取验证码凭证成功"), log.debug(`🔑 验证码凭证: ${o.ticket}`);
    const { data: r } = await Recoginze(o.canvasSrc);
    return (
      log.info("✅ 识别验证码成功"),
      log.debug(`🔑 验证码: ${r}`),
      { code: r, ticket: o.ticket }
    );
  } catch (e) {
    return Promise.reject("获取验证码失败: " + e);
  } finally {
    console.log("🔚 获取验证码结束");
  }
}
async function login(e, o) {
  console.log("⏳ 登录中...");
  try {
    const r = {
        url: `/api${$api.loginTestCodeNew}`,
        method: "post",
        headers: { ...requestKey },
        data: {
          loginKey: e,
          code: o,
          params: {
            uscInfo: {
              devciceIp: "",
              tenant: "state_grid",
              member: "0902",
              devciceId: "",
            },
            quInfo: {
              optSys: "android",
              pushId: "000000",
              addressProvince: "110100",
              password: PASSWORD,
              addressRegion: "110101",
              account: USERNAME,
              addressCity: "330100",
            },
          },
          Channels: "web",
        },
      },
      { bizrt: s } = await request(r);
    if (!(s?.userInfo?.length > 0))
      return Promise.reject("登录失败: 请检查信息填写是否正确! ");
    store.set("95598_bizrt", jsonStr(s)),
      (Global.bizrt = s),
      log.info("✅ 登录成功"),
      log.debug(
        `🔑 用户凭证: ${s.token}`,
        `👤 用户信息: ${s.userInfo[0].nickname || s.userInfo[0].loginAccount}`
      );
  } catch (e) {
    return /验证错误/.test(e)
      ? (log.error(`滑块验证出错, 重新登录: ${e}`), await doLogin())
      : Promise.reject(`登陆失败: ${e}`);
  } finally {
    console.log("🔚 登录结束");
  }
}
async function getAuthcode() {
  console.log("⏳ 获取授权码...");
  try {
    const e = {
        url: `/api${$api.getAuth}`,
        method: "post",
        headers: { ...requestKey, token: bizrt.token },
      },
      { redirect_url: o } = await request(e);
    (Global.authorizecode = o.split("?code=")[1]),
      log.info("✅ 获取授权码成功"),
      log.debug(`🔑 授权码: ${authorizecode}`);
  } catch (e) {
    return Promise.reject(`获取授权码失败: ${e}`);
  } finally {
    console.log("🔚 获取授权码结束");
  }
}
async function getAccessToken() {
  console.log("⏳ 获取凭证...");
  try {
    const e = {
      url: `/api${$api.getWebToken}`,
      method: "post",
      headers: {
        ...requestKey,
        token: bizrt.token,
        authorizecode: authorizecode,
      },
    };
    (Global.accessToken = await request(e).then((e) => e.access_token)),
      log.info("✅ 获取凭证成功"),
      log.debug(`🔑 AccessToken: ${accessToken}`);
  } catch (e) {
    return Promise.reject(`获取凭证失败: ${e}`);
  } finally {
    console.log("🔚 获取凭证结束");
  }
}
async function getBindInfo() {
  console.log("⏳ 查询绑定信息...");
  try {
    const e = {
      url: `/api${$api.searchUser}`,
      method: "post",
      headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
      data: {
        serviceCode: $configuration.userInform.serviceCode,
        source: $configuration.source,
        target: $configuration.target,
        uscInfo: {
          member: $configuration.uscInfo.member,
          devciceIp: $configuration.uscInfo.devciceIp,
          devciceId: $configuration.uscInfo.devciceId,
          tenant: $configuration.uscInfo.tenant,
        },
        quInfo: { userId: bizrt.userInfo[0].userId },
        token: bizrt.token,
        Channels: "web",
      },
    };
    (Global.bindInfo = await request(e).then((e) => e.bizrt)),
      log.info("✅ 获取绑定信息成功"),
      log.debug(`🔑 用户绑定信息: ${jsonStr(bindInfo, null, 2)}`);
  } catch (e) {
    return Promise.reject(`获取绑定信息失败: ${e}`);
  } finally {
    console.log("🔚 查询绑定信息结束");
  }
}
async function getElcFee(e) {
  console.log("⏳ 查询电费...");
  try {
    const o = bindInfo.powerUserList[e],
      [r] = bizrt.userInfo,
      s = {
        url: `/api${$api.accapi}`,
        method: "post",
        headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
        data: {
          data: {
            srvCode: "",
            serialNo: "",
            channelCode: $configuration.account.channelCode,
            funcCode: $configuration.account.funcCode,
            acctId: r.userId,
            userName: r.loginAccount ? r.loginAccount : r.nickname,
            promotType: "1",
            promotCode: "1",
            userAccountId: r.userId,
            list: [
              {
                consNoSrc: o.consNo_dst,
                proCode: o.proNo,
                sceneType: o.constType,
                consNo: o.consNo,
                orgNo: o.orgNo,
              },
            ],
          },
          serviceCode: "0101143",
          source: $configuration.source,
          target: o.proNo || o.provinceId,
        },
      };
    (Global.eleBill = await request(s).then((e) => e.list[0])),
      log.info("✅ 查询电费成功"),
      log.debug(`🔑 电费信息: ${jsonStr(Global.eleBill, null, 2)}`);
    if (Global.eleBill.powerUserList)
      store.set("eleBill", jsonStr(Global.eleBill));
    else if (store.get("eleBill"))
      Global.eleBill = jsonParse(store.get("eleBill"));
  } catch (e) {
    if (store.get("eleBill")) Global.eleBill = jsonParse(store.get("eleBill"));
    return console.log(`查询电费失败: ${e}`);
  } finally {
    console.log("🔚 查询电费结束");
  }
}
async function getDayElecQuantity(e) {
  console.log("⏳ 获取日用电量...");
  try {
    const o = bindInfo.powerUserList[e],
      [r] = bizrt.userInfo,
      s = getBeforeDate(6),
      n = getBeforeDate(1),
      c = {
        url: `/api${$api.busInfoApi}`,
        method: "post",
        headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
        data: {
          params1: {
            serviceCode: $configuration.serviceCode,
            source: $configuration.source,
            target: $configuration.target,
            uscInfo: {
              member: $configuration.uscInfo.member,
              devciceIp: $configuration.uscInfo.devciceIp,
              devciceId: $configuration.uscInfo.devciceId,
              tenant: $configuration.uscInfo.tenant,
            },
            quInfo: { userId: r.userId },
            token: bizrt.token,
          },
          params3: {
            data: {
              acctId: r.userId,
              consNo: o.consNo_dst,
              consType: "02" == o.constType ? "02" : "01",
              endTime: n,
              orgNo: o.orgNo,
              queryYear: new Date().getFullYear().toString(),
              proCode: o.proNo || o.provinceId,
              serialNo: "",
              srvCode: "",
              startTime: s,
              userName: r.nickname ? r.nickname : r.loginAccount,
              funcCode: $configuration.getday.funcCode,
              channelCode: $configuration.getday.channelCode,
              clearCache: $configuration.getday.clearCache,
              promotCode: $configuration.getday.promotCode,
              promotType: $configuration.getday.promotType,
            },
            serviceCode: $configuration.getday.serviceCode,
            source: $configuration.getday.source,
            target: o.proNo || o.provinceId,
          },
          params4: "010103",
        },
      },
      t = await request(c);
    log.info("✅ 获取日用电量成功"),
      log.debug(jsonStr(t, null, 2)),
      (Global.dayElecQuantity = t);
    if (Global.dayElecQuantity.sevenEleList)
      store.set("dayElecQuantity", jsonStr(Global.dayElecQuantity));
    else if (store.get("dayElecQuantity"))
      Global.dayElecQuantity = jsonParse(store.get("dayElecQuantity"));
  } catch (e) {
    if (store.get("dayElecQuantity"))
      Global.dayElecQuantity = jsonParse(store.get("dayElecQuantity"));
    return console.log("获取日用电量失败: " + e);
  } finally {
    console.log("🔚 获取日用电量结束");
  }
}

async function getDay31ElecQuantity(e) {
  console.log("⏳ 获取日用电量...");
  try {
    const o = bindInfo.powerUserList[e],
      [r] = bizrt.userInfo,
      s = getBeforeDate(32),
      n = getBeforeDate(1),
      c = {
        url: `/api${$api.busInfoApi}`,
        method: "post",
        headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
        data: {
          params1: {
            serviceCode: $configuration.serviceCode,
            source: $configuration.source,
            target: $configuration.target,
            uscInfo: {
              member: $configuration.uscInfo.member,
              devciceIp: $configuration.uscInfo.devciceIp,
              devciceId: $configuration.uscInfo.devciceId,
              tenant: $configuration.uscInfo.tenant,
            },
            quInfo: { userId: r.userId },
            token: bizrt.token,
          },
          params3: {
            data: {
              acctId: r.userId,
              consNo: o.consNo_dst,
              consType: "02" == o.constType ? "02" : "01",
              endTime: n,
              orgNo: o.orgNo,
              queryYear: new Date().getFullYear().toString(),
              proCode: o.proNo || o.provinceId,
              serialNo: "",
              srvCode: "",
              startTime: s,
              userName: r.nickname ? r.nickname : r.loginAccount,
              funcCode: $configuration.getday.funcCode,
              channelCode: $configuration.getday.channelCode,
              clearCache: $configuration.getday.clearCache,
              promotCode: $configuration.getday.promotCode,
              promotType: $configuration.getday.promotType,
            },
            serviceCode: $configuration.getday.serviceCode,
            source: $configuration.getday.source,
            target: o.proNo || o.provinceId,
          },
          params4: "010103",
        },
      },
      t = await request(c);
    log.info("✅ 获取32日用电量成功"),
      log.debug(jsonStr(t, null, 2)),
      (Global.dayElecQuantity31 = t);

    if (Global.dayElecQuantity31.sevenEleList)
      store.set("dayElecQuantity31", jsonStr(Global.dayElecQuantity31));
    else if (store.get("dayElecQuantity31"))
      Global.dayElecQuantity31 = jsonParse(store.get("dayElecQuantity31"));
  } catch (e) {
    if (store.get("dayElecQuantity31"))
      Global.dayElecQuantity31 = jsonParse(store.get("dayElecQuantity31"));
    return console.log("获取32日用电量失败: " + e);
  } finally {
    console.log("🔚 获取32日用电量结束");
  }
}
async function getMonthElecQuantity(e) {
  console.log("⏳ 获取月用电量...");
  const o = bindInfo.powerUserList[e],
    [r] = bizrt.userInfo;
  try {
    let e = {
      url: `/api${$api.busInfoApi}`,
      method: "post",
      headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
      data: {
        params1: {
          serviceCode: $configuration.serviceCode,
          source: $configuration.source,
          target: $configuration.target,
          uscInfo: {
            member: $configuration.uscInfo.member,
            devciceIp: $configuration.uscInfo.devciceIp,
            devciceId: $configuration.uscInfo.devciceId,
            tenant: $configuration.uscInfo.tenant,
          },
          quInfo: { userId: r.userId },
          token: bizrt.token,
        },
        params3: {
          data: {
            acctId: r.userId,
            consNo: o.consNo_dst,
            consType: "02" == o.constType ? "02" : "01",
            orgNo: o.orgNo,
            proCode: o.proNo || o.provinceId,
            provinceCode: o.proNo || o.provinceId,
            queryYear: new Date().getFullYear().toString(),
            serialNo: "",
            srvCode: "",
            userName: r.nickname ? r.nickname : r.loginAccount,
            funcCode: $configuration.mouthOut.funcCode,
            channelCode: $configuration.mouthOut.channelCode,
            clearCache: $configuration.mouthOut.clearCache,
            promotCode: $configuration.mouthOut.promotCode,
            promotType: $configuration.mouthOut.promotType,
          },
          serviceCode: $configuration.mouthOut.serviceCode,
          source: $configuration.mouthOut.source,
          target: o.proNo || o.provinceId,
        },
        params4: "010102",
      },
    };
    const s = await request(e);
    log.info("✅ 获取月用电量成功"),
      log.debug(jsonStr(s, null, 2)),
      (Global.monthElecQuantity = s);
    if (Global.monthElecQuantity.mothEleList)
      store.set("monthElecQuantity", jsonStr(Global.monthElecQuantity));
    else if (store.get("monthElecQuantity"))
      Global.monthElecQuantity = jsonParse(store.get("monthElecQuantity"));
  } catch (e) {
    if (store.get("monthElecQuantity"))
      Global.monthElecQuantity = jsonParse(store.get("monthElecQuantity"));
    return console.log(`获取月用电量失败: ${e}`);
  } finally {
    console.log("🔚 获取月用电量结束");
  }
}

async function getLastYearElecQuantity(e) {
  console.log("⏳ 获取去年用电量...");
  const o = bindInfo.powerUserList[e],
    [r] = bizrt.userInfo;
  try {
    let e = {
      url: `/api${$api.busInfoApi}`,
      method: "post",
      headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
      data: {
        params1: {
          serviceCode: $configuration.serviceCode,
          source: $configuration.source,
          target: $configuration.target,
          uscInfo: {
            member: $configuration.uscInfo.member,
            devciceIp: $configuration.uscInfo.devciceIp,
            devciceId: $configuration.uscInfo.devciceId,
            tenant: $configuration.uscInfo.tenant,
          },
          quInfo: { userId: r.userId },
          token: bizrt.token,
        },
        params3: {
          data: {
            acctId: r.userId,
            consNo: o.consNo_dst,
            consType: "02" == o.constType ? "02" : "01",
            orgNo: o.orgNo,
            proCode: o.proNo || o.provinceId,
            provinceCode: o.proNo || o.provinceId,
            queryYear: (new Date().getFullYear() - 1).toString(),
            serialNo: "",
            srvCode: "",
            userName: r.nickname ? r.nickname : r.loginAccount,
            funcCode: $configuration.mouthOut.funcCode,
            channelCode: $configuration.mouthOut.channelCode,
            clearCache: $configuration.mouthOut.clearCache,
            promotCode: $configuration.mouthOut.promotCode,
            promotType: $configuration.mouthOut.promotType,
          },
          serviceCode: $configuration.mouthOut.serviceCode,
          source: $configuration.mouthOut.source,
          target: o.proNo || o.provinceId,
        },
        params4: "010102",
      },
    };
    const s = await request(e);
    log.info("✅ 获取去年电量成功"),
      log.debug(jsonStr(s, null, 2)),
      (Global.lastYearElecQuantity = s);
    if (Global.lastYearElecQuantity.dataInfo)
      store.set("lastYearElecQuantity", jsonStr(Global.lastYearElecQuantity));
    else if (store.get("lastYearElecQuantity"))
      Global.lastYearElecQuantity = jsonParse(
        store.get("lastYearElecQuantity")
      );
  } catch (e) {
    if (store.get("lastYearElecQuantity"))
      Global.lastYearElecQuantity = jsonParse(
        store.get("lastYearElecQuantity")
      );
    return console.log(`获取月用电量失败: ${e}`);
  } finally {
    console.log("🔚 获取月用电量结束");
  }
}

async function getSegmentDate(e, o) {
  console.log("⏳ 江苏地区特殊处理...");
  try {
    let r = {
      url: `/api${$api.segmentDate}`,
      method: "post",
      headers: {
        ...requestKey,
        token: bizrt.token,
        acctoken: accessToken,
      },
      data: {
        data: {
          acctId: "acctid01",
          channelCode: "SGAPP",
          consNo: e.consNo_dst,
          funcCode: "A10079078",
          promotCode: "1",
          promotType: "1",
          provinceCode: "32101",
          serialNo: "",
          srvCode: "123",
          userName: "acctid01",
          year: o.year,
        },
        serviceCode: "0101798",
        source: "app",
        target: e.proNo,
      },
    };
    const s = await request(r);
    log.info("✅ 江苏地区特殊处理成功"), log.debug(jsonStr(s, null, 2));
    let t = s.billList;
    return t[t.length - 1];
  } catch (e) {
    throw new Error(`江苏地区特殊处理失败: ${e}`);
  } finally {
    console.log("🔚 江苏地区特殊处理结束");
  }
}

async function getStepElecQuantity(e, months) {
  console.log("⏳ 获取阶梯用电...");
  try {
    const o = bindInfo.powerUserList[e],
      [r] = bizrt.userInfo;
    let s = new Date(),
      t = { year: s.getFullYear(), months: months || s.getMonth() },
      n = "",
      c = "",
      a = t.months;
    a <= 9 ? (n = t.year + "-0" + a) : a > 9 && (n = t.year + "-" + a);
    let i = "";
    "32101" === o.proNo
      ? ((c = await getSegmentDate(o, t)), (i = t.year + "-" + a))
      : (i = n);
    const m = {
        url: `/api/${
          "33101" == (o.orgNo || o.provinceId)
            ? "01" == o.constType
              ? $api.HideelectBill
              : $api.LowelectBill
            : $api.electBill
        }`,
        method: "post",
        headers: { ...requestKey, token: bizrt.token, acctoken: accessToken },
        data: {
          data: {
            channelCode: $configuration.stepelect.channelCode,
            funcCode: $configuration.stepelect.funcCode,
            promotType: $configuration.stepelect.promotType,
            clearCache: $configuration.stepelect.clearCache,
            consNo: o.consNo_dst,
            promotCode: o.proNo || o.provinceId,
            orgNo: o.orgNo || n.orgNo,
            queryDate: i,
            provinceCode: o.proNo || o.provinceId,
            consType: o.constType || o.consSortCode,
            userAccountId: r.userId,
            serialNo: "",
            srvCode: "",
            calcId: c ? c.calcId : void 0,
            userName: r.nickname || r.loginAccount,
            acctId: r.userId,
          },
          serviceCode: $configuration.stepelect.serviceCode,
          source: $configuration.stepelect.source,
          target: o.proNo || o.provinceId,
        },
      },
      g = await request(m);
    if (
      (log.info("✅ 获取阶梯用电成功"),
      log.debug(jsonStr(g, null, 2)),
      "1" !== g.rtnCode)
    )
      return Promise.reject(g.rtnMsg);
    Global.stepElecQuantity = g.list || {};

    if (Global.stepElecQuantity.sevenEleList)
      store.set("stepElecQuantity", jsonStr(Global.stepElecQuantity));
    else if (store.get("stepElecQuantity"))
      Global.stepElecQuantity = jsonParse(store.get("stepElecQuantity"));
  } catch (e) {
    if (store.get("stepElecQuantity"))
      Global.stepElecQuantity = jsonParse(store.get("stepElecQuantity"));
    return console.log(`获取阶梯用电失败: ${e}`);
  } finally {
    console.log("🔚 获取阶梯用电结束");
  }
}

async function doLogin() {
  const { code: e, ticket: o } = await getVerifyCode();
  await login(o, e);
}
async function showNotice() {
  console.log(""),
    console.log("1. 本脚本仅用于学习研究，禁止用于商业用途"),
    console.log("2. 本脚本不保证准确性、可靠性、完整性和及时性"),
    console.log("3. 任何个人或组织均可无需经过通知而自由使用"),
    console.log("4. 作者对任何脚本问题概不负责，包括由此产生的任何损失"),
    console.log(
      "5. 如果任何单位或个人认为该脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明、所有权证明，我将在收到认证文件确认后删除"
    ),
    console.log("6. 请勿将本脚本用于商业用途，由此引起的问题与作者无关"),
    console.log("7. 本脚本及其更新版权归作者所有"),
    console.log("");
}
async function sendMsg(e, o, r, s) {
  const n = s?.["open-url"] || s?.openUrl || s?.$open || s?.url,
    c = s?.["media-url"] || s?.mediaUrl || s?.$media;
  isNode()
    ? ((r += n ? `\n点击跳转: ${n}` : ""),
      (r += c ? `\n多媒体: ${c}` : ""),
      console.log(`${e}\n${o}\n${r}\n`),
      await Notify.sendNotify(`${e}\n${o}`, r))
    : notify(e, o, r, s);
}

function getDataSource(o) {
  const params = getUrlParams($request.url);
  if (!Object.keys(params).length)
    return Promise.all([
      getElcFee(o),
      getDayElecQuantity(o),
      getDay31ElecQuantity(o),
      getMonthElecQuantity(o),
      getLastYearElecQuantity(o),
      getStepElecQuantity(o),
    ]);
  const requestData = [];
  if (params.eleBill) requestData.push(getElcFee(o));
  if (params.dayElecQuantity) requestData.push(getDayElecQuantity(o));
  if (params.dayElecQuantity31) requestData.push(getDay31ElecQuantity(o));
  if (params.monthElecQuantity) requestData.push(getMonthElecQuantity(o));
  if (params.lastYearElecQuantity) requestData.push(getLastYearElecQuantity(o));
  if (params.stepElecQuantity) requestData.push(getStepElecQuantity(o));
  return Promise.all(requestData);
}

(async () => {
  if ((await showNotice(), !USERNAME || !PASSWORD))
    return sendMsg(
      SCRIPTNAME,
      "请先配置网上国网账号密码!",
      "点击前往BoxJs配置",
      {
        "open-url":
          "http://boxjs.com/#/sub/add/https%3A%2F%2Fraw.githubusercontent.com%2FYuheng0101%2FX%2Fmain%2FTasks%2Fboxjs.json",
      }
    );
  await getKeyCode(),
    (bizrt?.token && bizrt?.userInfo) || (await doLogin()),
    await getAuthcode(),
    await getAccessToken(),
    await getBindInfo();
  const e = new Array(bindInfo.powerUserList.length);
  for (let o = 0; o < bindInfo.powerUserList.length; o++) {
    try {
      await getDataSource(o);
    } catch (error) {
      let months = new Date().getMonth() - 1;
      if (months === -1) months = 11;
      await getStepElecQuantity(o, months);
    }
    const r = bindInfo.powerUserList[o];
    const c =
      Number(eleBill?.historyOwe || "0") > 0 ||
      Number(eleBill?.sumMoney || "0") < 0;
    e[o] = {
      eleBill: Global.eleBill,
      userInfo: r,
      dayElecQuantity: Global.dayElecQuantity,
      dayElecQuantity31: Global.dayElecQuantity31,
      monthElecQuantity: Global.monthElecQuantity,
      lastYearElecQuantity: Global.lastYearElecQuantity,
      stepElecQuantity: Global.stepElecQuantity,
      arrearsOfFees: c,
    };
  }
  const o = {
    status: isQuanX() ? "HTTP/1.1 200" : 200,
    headers: { "content-type": "application/json;charset=utf8" },
    body: jsonStr(e),
  };
  done(isQuanX() ? o : { response: o });
})()
  .catch((e) => {
    /无效|失效|过期|重新获取|请求异常/.test(e) &&
      (store.clear("95598_bizrt"), console.log("✅ 清理缓存数据成功")),
      log.error(e);
  })
  .finally(done);