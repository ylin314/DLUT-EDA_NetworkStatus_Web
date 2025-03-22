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

function updateTable(data) {
    $('#onlineStatus').text(data.result === 1 ? '在线' : '离线');
    $('#account').text(data.uid);
    $('#name').text(data.NID);
    if (data.v4ip) {
        $('#ipAddress').text(data.v4ip);
    } else {
        $('#ipAddress').text(data.v46ip);
    }
    if (data.result !== 1) return;
    $('#macAddress').text(data.olmac.split(':').join('; '));
    $('#usedFlow').text(formatBytes(data.flow));
    $('#remainingFlow').text(formatBytes(data.olflow));
    $('#loginTime').text(data.etime);
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
}

function showErrorMessage(error) {
    $('#errorMsg').text(`数据加载失败: ${error}`);
    cleanTable();
}

async function loadData() {
    $('#errorMsg').text(``);
    if (!navigator.onLine) {
        showErrorMessage('没有连接到校园网');
        return;
    }
    try {
        let response = await fetch('http://172.20.30.1/drcom/chkstatus?callback=');
        if (!response.ok) {
            throw new Error(`HTTP 错误 ${response.status}: ${response.statusText}`);
        }

        let arrayBuffer = await response.arrayBuffer();
        let decoder = new TextDecoder('gbk');
        let text = decoder.decode(arrayBuffer);

        let data = "{" + text.split("({")[1].split("})")[0] + "}";
        updateTable(JSON.parse(data));
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            showErrorMessage('net::ERR_CONNECTION_REFUSED OR net::ERR_NETWORK_CHANGED');
        } else {
            showErrorMessage(`请求失败: ${error.message}`);
        }
    }
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