function Mine(tr, td, mineNum) {
    this.tr = tr; //行数
    this.td = td; //列数
    this.mineNum = mineNum; //雷的数量

    this.squares = []; //储存所有方块的信息，他是一个二维数组，按行与列的顺序排放存取
    this.tds = []; //储存所有单元格的DOM对象，方便后期操作格子样式
    this.surplusMine = mineNum; //剩余雷的数量
    this.allRight = false; //成功标志，右击标的小红旗是否都是雷

    this.gameboxDom = document.querySelector('.gameBox');
}

//创建长度为tr*td的一维数组，乱序后截取前九十九个数值组成数组保存在randomNum中作为返回值，达成将雷随机分布的目的
Mine.prototype.randomNum = function() {
    var square = new Array(this.tr * this.td); //生成一个长度为tr*td的空数组
    for (var i = 0; i < square.length; i++) {
        square[i] = i;
    }
    square.sort(function() { return 0.5 - Math.random() });
    return square.slice(0, this.mineNum);
}

//游戏数据初始化
Mine.prototype.init = function() {
    var rn = this.randomNum(); 
    var n = 0; //用来找到对应的索引
    for (var i = 0; i < this.tr; i++) {
        this.squares[i] = [];
        for (var j = 0; j < this.td; j++) {
            //取一个方块在数组里的数据要使用行与列的形式去取，找方块周围的方块的时候要用坐标的形式去取，行列形式跟坐标形式xy相反
            if (rn.indexOf(++n) != -1) {
                //如果这个条件成立说明现在循环到的索引在雷的数组里找到了即该索引为雷
                this.squares[i][j] = { type: 'mine', x: j, y: i };
            } else {
                this.squares[i][j] = { type: 'number', x: j, y: i, value: 0 };
            }
        }
    }
    this.updateNum(); //更新数字
    this.createDom(); //创建雷盘

    this.gameboxDom.oncontextmenu = function() {
        return false;
    }

    //剩余雷数变动
    this.mineNumDom = document.querySelector('.mineNum');
    this.mineNumDom.innerHTML = this.surplusMine;

}

//创建雷盘，鼠标点击雷盘的td后就触发play函数，多层嵌套注意this指向，要确保准确调用可先将this储存在This中
Mine.prototype.createDom = function() {
    var This = this;
    var table = document.createElement('table');

    for (var i = 0; i < this.tr; i++) { //行
        var domTr = document.createElement('tr');
        this.tds[i] = []; 
        for (var j = 0; j < this.td; j++) { //列
            var domTd = document.createElement('td');
            domTd.pos = [i, j]; //把格子对应的行列存到格子身上，为了下面通过这个值在数组里取到对应的数据
            domTd.onmousedown = function() { 
                This.play(event, this); //This指的是实例对象，this指的是点击的domTd
            };

            this.tds[i][j] = domTd; //这里把所有创建的td添加到数组中
            domTr.appendChild(domTd);
        }
        table.appendChild(domTr);
    }
    
    //避免多次点击创建多个雷盘
    this.gameboxDom.innerHTML = ''; 
    this.gameboxDom.appendChild(table);
};

//找square周围不含雷的所有格子
Mine.prototype.getAround = function(square) {
    var x = square.x;
    var y = square.y;
    var result = []; 
    
    for (var i = x - 1; i <= x + 1; i++) {
        for (var j = y - 1; j <= y + 1; j++) {
            if (!(
                    i < 0 || //上边界
                    j < 0 || //左边界
                    i > this.td - 1 || //下边界
                    j > this.tr - 1 || //右边界
                    (i == x && j == y) || //自身
                    this.squares[j][i].type == 'mine' //雷
                )) {
                result.push([j, i]);
            }
        }
    }
    return result;
};

//更新所有的数字
Mine.prototype.updateNum = function() {
    for (var i = 0; i < this.tr; i++) {
        for (var j = 0; j < this.td; j++) {
            //只更新雷周围的数字
            if (this.squares[j][i].type == 'mine') {
                var num = this.getAround(this.squares[j][i]); 
                for (var k = 0; k < num.length; k++) {
                    this.squares[num[k][0]][num[k][1]].value += 1;
                }
            }
        }
    }
}

//游戏函数
Mine.prototype.play = function(ev, obj) {
    var This = this;
    //后面的条件是为了用户标完小红旗后就不能左键点击了
    if (ev.which == 1 && obj.className != 'flag') {
        var curSquare = this.squares[obj.pos[0]][obj.pos[1]];
        var cl = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

        if (curSquare.type == 'number') {
            //如果点的是数字
            obj.innerHTML = curSquare.value;
            obj.className = cl[curSquare.value];

            //如果点到了数字0
            if (curSquare.value == 0) {
                obj.innerHTML = ''; 

                function getAllZero(square) {
                    var around = This.getAround(square);
                    //点击处为0时找到点击处周围不含雷的所有格子
                    for (var i = 0; i < around.length; i++) {      
                        var x = around[i][0]; //行
                        var y = around[i][1]; //列
                        This.tds[x][y].className = cl[This.squares[x][y].value];
                        //如果周围坐标中刚好有0的话，就递归调用自身，直到周围不再有0
                        if (This.squares[x][y].value == 0) {
                            if (!This.tds[x][y].check) {
                                This.tds[x][y].check = true; //被取过的check为true防止被再次循环
                                getAllZero(This.squares[x][y]);
                            }
                        } else {
                            //如果以某个格子为中心找到的周围格子值不为0则显示数字
                            This.tds[x][y].innerHTML = This.squares[x][y].value;
                        }
                    }
                }
                //执行函数
                getAllZero(curSquare);
            }
        } else {
            //用户点到的是雷
            this.gameOver(obj);
        }
    }

    //用户点击的是右键
    if (ev.which == 3) {
        //如果右击的是数字，那就不能点击，className只能是数字或者flag，这里的判定导致右击为数字时直接跳出函数
        if (obj.className && obj.className != 'flag') {
            return;
        }
        //点击右键，前面已经过滤掉className为数字的情况，此时如果有flag标志说明标了小红旗，那就取消，没有标志的话就加上，同时下方剩余雷数变动
        obj.className = obj.className == 'flag' ? '' : 'flag';
        if (obj.className == 'flag') {
            this.mineNumDom.innerHTML = --this.surplusMine;
        } else {
            this.mineNumDom.innerHTML = ++this.surplusMine;
        }
        
        if (this.squares[obj.pos[0]][obj.pos[1]].type == 'mine') {
            this.allRight = true; //用户标的小红旗背后都是雷
        } else {
            this.allRight = false;
        }

        if (this.surplusMine == 0) {
            //剩余的雷的数量为0表示用户标完小红旗了，这时候要判断游戏是否成功
            if (this.allRight) {
                //条件成立说明用户全部标对了
                alert('恭喜你')
                mine.init();
            } else {
                alert('游戏失败')
                mine.init();
            }
        }
    }
};

//游戏失败函数
Mine.prototype.gameOver = function(clickTd) {
    for (var i = 0; i < this.tr; i++) {
        for (var j = 0; j < this.td; j++) {
            if (this.squares[i][j].type == 'mine') {
                this.tds[i][j].className = 'mine';
            }
            if (this.squares[i][j].type == 'number') {
                if (this.squares[i][j].value != 0) {
                    this.tds[i][j].innerHTML = this.squares[i][j].value;
                }
            }
            this.tds[i][j].onmousedown = null;
        }
    }
    if (clickTd) {
        clickTd.style.border = '2px solid #f00';
    }
}

//上边button的功能
var btns = document.querySelectorAll('.level button');
var mine = null; //存储生成的实例
var arr = [
        [9, 9, 10],
        [16, 16, 40],
        [28, 28, 99]
    ] //不同级别的行数列数雷数

for (let i = 0; i < btns.length - 1; i++) {
    btns[i].onclick = function() {
        for (let i = 0; i < btns.length - 1; i++) {
            btns[i].className = '';
        }
        this.className = 'active';

        mine = new Mine(...arr[i]);
        mine.init();
    }
}
btns[2].onclick(); //初始化,点开时默认显示高级
btns[3].onclick = function() {
    mine.init();
}
