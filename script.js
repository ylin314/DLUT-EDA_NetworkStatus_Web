function formatBytes(bytes) {
    const kb = 1024;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes > kb) {
        bytes /= kb;
        i++;
    }
    return bytes.toFixed(2) + ' ' + units[i];
}

function formatMacAddress(mac) {
    return mac.toUpperCase().match(/.{1,2}/g).join('-');
}

/* 
 * 可以通过 GET http://auth.dlut.edu.cn/eportal/redirectortosuccess.jsp
 * 来判断连接到的校园网还是外部网络：
 * 如果响应 Location 头是 http://123.123.123.123/ ，说明在校园网环境。
 * 但是有跨域问题，本地没法测试，
 * 并且这么做虽然能判断是否为校园网环境，但是无法区分是 连接到了DLUT-EDA但是未登录 还是 连接到了无需登录的免费网络(如创中、实验室网络)，还得进一步区分
 * 太麻烦了，所以我摆烂了，等大佬处理
 */

function updateTable(data) {
    $('#errorMsg').text('');
    $('#onlineStatus').text(data.result === 1 ? '在线' : '离线');

    if (data.result !== 1) {
        $('#account').text('-');
        $('#name').text('-');
        $('#ipAddress').text('-');
        $('#macAddress').text('-');
        $('#usedFlow').text('-');
        $('#remainingFlow').text('-');
        $('#loginTime').text('-');
        $('#terminalType').text('-');
        return;
    }

    $('#account').text(data.uid);
    $('#name').text(data.NID);
    if (data.v4ip) {
        $('#ipAddress').text(data.v4ip);
    } else {
        $('#ipAddress').text(data.v46ip);
    }
    $('#macAddress').text(formatMacAddress(data.olmac)); 
    $('#usedFlow').text(formatBytes(data.flow));
    $('#remainingFlow').text(formatBytes(data.olflow));
    $('#loginTime').text(data.etime);
    $('#terminalType').text(data.terminalType);
}

function cleanTable() {
    $('#onlineStatus').text('-');
    $('#account').text('-');
    $('#name').text('-');
    $('#ipAddress').text('-');
    $('#macAddress').text('-');
    $('#usedFlow').text('-');
    $('#remainingFlow').text('-');
    $('#loginTime').text('-');
    $('#terminalType').text('-');
}

function showErrorMessage(error) {
    $('#errorMsg').text(`数据加载失败: ${error}`);
    cleanTable();
}

let isLoading = false;

function loadData() {
    if (isLoading)
        return;
    isLoading = true; 

    if (!navigator.onLine) {
        $('#onlineStatus').text('未连接到互联网');
        $('#account').text('-');
        $('#name').text('-');
        $('#ipAddress').text('-');
        $('#macAddress').text('-');
        $('#usedFlow').text('-');
        $('#remainingFlow').text('-');
        $('#loginTime').text('-');
        $('#terminalType').text('-');
        isLoading = false;
        return;
    }

    fetch('http://172.20.30.1/drcom/chkstatus?callback=')
        .then(response => {
            if (!response.ok) {
                showErrorMessage(`${response.status} ${response.statusText}`);
                isLoading = false;
                return;
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            let decoder = new TextDecoder('gbk');
            let text = decoder.decode(arrayBuffer);
            let data = "{" + text.split("({")[1].split("})")[0] + "}";
            let parsedData = JSON.parse(data);

            parsedData.terminalType = checkUserAgent(navigator.userAgent);
            updateTable(parsedData);
        })
        .catch(error => {
            showErrorMessage(`${error.message || error}`);
        })
        .finally(() => {
            isLoading = false;
        });
}

function checkUserAgent(UserAgent) { //跨域问题获取不到终端类型字段，但是这个函数是直接抄的dashboard里的，所以结果应该没差
    var mobileKeywords = ["Android", "iPhone", "iPod", "iPad", "Windows Phone", "MQQBrowser"];

    if (UserAgent.includes("Windows NT")) return "PC";
    if (UserAgent.includes("Macintosh")) return "MAC OS";

    for (var i = 0; i < mobileKeywords.length; i++) {
        if (UserAgent.includes(mobileKeywords[i])) return "移动终端";
    }

    return "未知设备";
}

// function loadData() {
//     $.get('http://172.20.30.1/drcom/chkstatus?callback=', function (data) {
//         cleanTable();
//         data = "{" + data.split("({")[1].split("})")[0] + "}";
//         data = JSON.parse(data);
//         updateTable(data);
//     });
// }

$('#loginBtn').click(function () {
    $.get('http://172.20.30.1/drcom/chkstatus?callback=', function (data) {
        data = "{" + data.split("({")[1].split("})")[0] + "}";
        data = JSON.parse(data);
        let v4ip = data.v4ip;
        let loginUrl = `https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login%3Fwlan_user_ip%3D${v4ip}%26authex_enable%3D%26type%3D1`;
        //补救v4ip获取失败的情况
        if (!v4ip) {
            let v46ip = data.v46ip;
            loginUrl = `https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login%3Fwlan_user_ip%3D${v46ip}%26authex_enable%3D%26type%3D1`;
        }
        console.log(loginUrl);
        window.open(loginUrl, '_blank');
    });
});

$('#selfServiceBtn').click(function () {
    const selfServiceUrl = 'https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login';
    window.open(selfServiceUrl, '_blank');
});

$('#logoutBtn').click(function () {
    window.open('http://172.20.30.1/', '_blank');
});


$('#refreshBtn').click(function () {
    cleanTable();
    loadData();
});

loadData();
setInterval(loadData, 5000);