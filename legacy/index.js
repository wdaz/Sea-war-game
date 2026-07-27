
startButton.addEventListener("click", function () {
    gemiDuzulusu();
    fourBoxShip();
    threeBoxShip();
    twoBoxShip();
    oneBoxship();
   document.getElementById("hedefler").innerHTML = hedefArr;
    mainDiv.addEventListener("click", hedefM);
})

function gemiDuzulusu() {
    hedefArr = [];
    let c = mainDiv.childNodes;
    for (let m = 0, len = c.length; m < len; m++) {
        if (c[m].className == "hedef") c[m].className = [m];
    }
    mainDiv.className = "mainDivClass";
    while (i < 100) {
        xana_div = document.createElement("div");
        xana_div.className = "" + [i] + "";
        mainDiv.appendChild(xana_div);
        i++;
    };
};


function fourBoxShip() {
    let firstBox = helper.randomEl(),            //Geminin birinci giris noqtesi
        birinciHedefNoqtesi = firstBox % 10,         //istiqamet yoxlanisi
        gemiBortsayi = 4;
    yoxlamaArr = helper.gemiYoxlama(birinciHedefNoqtesi, gemiBortsayi, firstBox);
    let istiqamet = helper.istiqamet(yoxlamaArr);
    helper.hedefYerleshmesi(istiqamet, firstBox, gemiBortsayi, hedefArr);
}

function threeBoxShip() {
    for (let threeboxship = 0; threeboxship < 2; threeboxship++) {
        let threeBox = helper.randomEl(),            //Geminin birinci giris noqtesi
            birinciHedefNoqtesi = threeBox % 10,         //istiqamet yoxlanisi
            gemiBortsayi = 3;
        yoxlama = false;
        for (let m = 0, arrL = hedefArr.length; m < arrL; m++) {
            if ((threeBox == hedefArr[m]
                || threeBox == hedefArr[m] - 1
                || threeBox == hedefArr[m] - 2
                || threeBox == hedefArr[m] - 3
                || threeBox == hedefArr[m] - 4
        //------------------------------------------
                || threeBox == hedefArr[m] + 1
                || threeBox == hedefArr[m] + 2
                || threeBox == hedefArr[m] + 3
                || threeBox == hedefArr[m] + 4
        //------------------------------------------
                || threeBox == hedefArr[m] + 9
                || threeBox == hedefArr[m] + 10
                || threeBox == hedefArr[m] + 11
        //------------------------------------------
                || threeBox == hedefArr[m] + 19
                || threeBox == hedefArr[m] + 20
                || threeBox == hedefArr[m] + 21
        //------------------------------------------
                || threeBox == hedefArr[m] + 29
                || threeBox == hedefArr[m] + 30
                || threeBox == hedefArr[m] + 31
                || threeBox == hedefArr[m] - 29
                || threeBox == hedefArr[m] - 10
                || threeBox == hedefArr[m] - 11
                || threeBox == hedefArr[m] - 19
                || threeBox == hedefArr[m] - 20
                || threeBox == hedefArr[m] - 21
                || threeBox == hedefArr[m] - 29
                || threeBox == hedefArr[m] - 30
                || threeBox == hedefArr[m] - 31)) {
                yoxlama = true;
            };
        };
        if (yoxlama == false) {
            yoxlamaArr = helper.gemiYoxlama(birinciHedefNoqtesi, gemiBortsayi, threeBox);
            let istiqamet = helper.istiqamet(yoxlamaArr);
            helper.hedefYerleshmesi(istiqamet, threeBox, gemiBortsayi, hedefArr);

        }
        else {
            threeboxship--;
            yoxlama = false;
        };
    };
};

function twoBoxShip() {
    for (let twoboxship = 0; twoboxship < 3; twoboxship++) {
        let twoBox = helper.randomEl(),            //Geminin birinci giris noqtesi
            birinciHedefNoqtesi = twoBox % 10,         //istiqamet yoxlanisi
            gemiBortsayi = 2;
        yoxlama = false;
        for (let m = 0, arrL = hedefArr.length; m < arrL; m++) {
            if ((twoBox == hedefArr[m]
                || twoBox == hedefArr[m] - 1
                || twoBox == hedefArr[m] - 2
                || twoBox == hedefArr[m] + 1
                || twoBox == hedefArr[m] + 2
            // ---------------------------------------    
                || twoBox == hedefArr[m] + 9
                || twoBox == hedefArr[m] + 10
                || twoBox == hedefArr[m] + 11
                || twoBox == hedefArr[m] + 19
            //-------------------------------------------------    
                || twoBox == hedefArr[m] + 20
                || twoBox == hedefArr[m] + 21
                || twoBox == hedefArr[m] - 19
                || twoBox == hedefArr[m] - 10
            // ---------------------------------------------
                || twoBox == hedefArr[m] - 11
                || twoBox == hedefArr[m] - 19
                || twoBox == hedefArr[m] - 20
                || twoBox == hedefArr[m] - 21)) {
                yoxlama = true;
            };
        };
        if (yoxlama == false) {
            yoxlamaArr = helper.gemiYoxlama(birinciHedefNoqtesi, gemiBortsayi, twoBox);
            let istiqamet = helper.istiqamet(yoxlamaArr);
            helper.hedefYerleshmesi(istiqamet, twoBox, gemiBortsayi, hedefArr);
        }
        else {
            twoboxship--;
            yoxlama = false;
        };
    };
};


function oneBoxship() {
    yoxlama = false;
    j = 0;
    for (j = 0; j < 4; j++) {
        item = helper.randomEl();
        for (let m = 0, arrL = hedefArr.length; m < arrL; m++) {
            if ((item == hedefArr[m]
                || item == hedefArr[m] - 1
                || item == hedefArr[m] + 1
                || item == hedefArr[m] + 9
                || item == hedefArr[m] + 10
                || item == hedefArr[m] + 11
                || item == hedefArr[m] - 9
                || item == hedefArr[m] - 10
                || item == hedefArr[m] - 11)) {
                yoxlama = true;
            }
        }
        if (yoxlama == false) {
            hedefArr.push(item);
        }
        else {
            j--;
            yoxlama = false;
        };
    };
};

function hedefM(e) {
    let counter = 0;
    let hedef = e.target;
    for (let m = 0, len = hedefArr.length; m < len; m++) {
        if (hedef.className == hedefArr[m]) {
            hedef.className = "hedef";
            counter++
        }
        if (counter == len) {
            mainDiv.removeEventListener("click", hedefM);
        };
    };
};



