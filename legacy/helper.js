

helper.randomEl = function () {
    return Math.floor(Math.random() * 100);
}

helper.gemiYoxlama = function (a, b,c) {
    yoxlamaArr = [];
    if (a - b >= 0) yoxlamaArr.push(1);                      // left side
    if (a + b <= 9) yoxlamaArr.push(2);                      // rigth side
    if ((c - ((b - 1) * 10)) >= 0) yoxlamaArr.push(3);       // upper side
    if ((c + ((b - 1) * 10) < 100)) yoxlamaArr.push(4);      // lower side
    return yoxlamaArr;

};

//istiqamet choxlugundan bir eded istiqamet sechimi
helper.istiqamet = function (yoxlama_Arr) {
    let ranDom = yoxlama_Arr[Math.floor(Math.random() * yoxlama_Arr.length)];
    return ranDom;
};

// Iki ve daha chox xanali gemilerin hedef secimi
helper.hedefYerleshmesi = function (a, t, n, h) {     // a - istiqamet , t = secilen birici noqte , n - gemi xana sayi, h- hedef coxlugu
    let m = 0
    h.push(t);
    if (a == 1) {
        while (m < n - 1) {
            t = t - 1;
            h.push(t);
            m++;
        };
    };
    if (a == 2) {
        while (m < n - 1) {
            t = t + 1;
            h.push(t);
            m++;
        };
    };
    if (a == 3) {
        while (m < n - 1) {
            t = t - 10;
            h.push(t);
            m++;
        };
    };
    if (a == 4) {
        while (m < n - 1) {
            t = t + 10;
            h.push(t);
            m++;
        };
    };
};


