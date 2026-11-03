// 調べるぽボタンを教えたらhtmlのonclick="showMap()"から呼ばれる
    /* word という箱をつくって(var)、入力欄の中身を取り出して(val)入れる」
    覚え方: var = 箱をつくる、val = 中身を取り出す */
    /* 英語の variable(ヴァリアブル=変数)の略 */
    /* 英語の value(バリュー=値)の略 */
function showMap() {
    var word = $('#word').val(); /* 入力文をとる */
    searchWord(word);/* 調べる関数をとる */
}

// ぴったりの言葉がきたら統制語にする
function searchWord(word) {
    var term = ""; /* ぴったりの言葉がきたら統制語にする箱 */
    searchWikidata(word); /* Wikidataにも説明を聞きに行く(API連携) */
    if (word === "犬" || word === "いぬ" || word === "わんこ" || word === "ドッグ"){
        term = "犬";
    }else if (word === "好き" || word === "すき" || word === "ライク" || word === "LIKE" || word === "LOVE"){
        term = "好き";
    }else if (word === "仕事" || word === "しごと" || word === "お仕事" || word === "ジョブ" || word === "JOB"){
        term = "仕事";
    }

// 文章の中に、キーワードが含まれる際は、統制語にする
    if (term ==="") {
        if (word.includes("犬")|| word.includes("いぬ")|| word.includes("わんこ")){
            term = "犬";
        }else if(word.includes("好き")|| word.includes("すき")|| word.includes("LIKE")){
            term = "好き";
        }else if(word.includes("仕事")|| word.includes("お仕事")|| word.includes("しごと")){
            term = "仕事";
        }
    }

//  見つからなかったら、知らせる
    if (term ==="") {
        $("#center").text("?"); /* #(シャープ)の意 「id の名前ですよ」という目印 です。 $ */
        $("#upper").text("-");
        $("#lower").text("-");
        $("#similar").text("-");
        $("#related").text("-");
        $("#lower").text("-");
        $("#upper").text("「 " + word + "」は、まだ登録されていません");
        return; /* ここで関数が終わる */
    }


// 統制語の４つの言葉を決める
// ＜span class="word"＞ で囲んだ言葉は、クリックできる言葉になる
var upper = "";
var lower = "";
var similar = "";
var related = "";

if (term === "犬") {
    upper = '<span class="word">動物</span>';
    lower = '<span class="word">柴犬</span>・<span class="word">プードル</span>';
    similar = '<span class="word">イヌ</span>・<span class="word">ワンコ</span>';
    related = '<span class="word">ペット</span>・<span class="word">散歩</span>';
}else if (term === "好き") {
    upper = '<span class="word">気持ち</span>';
    lower = '<span class="word">大好き</span>・<span class="word">愛着</span>';
    similar = '<span class="word">好意</span>・<span class="word">好み</span>';
    related = '<span class="word">趣味</span>・<span class="word">ペット</span>';
}else if (term === "仕事") {
    upper = '<span class="word">活動</span>';
    lower = '<span class="word">営業</span>・<span class="word">事務</span>';
    similar = '<span class="word">職業</span>・<span class="word">業務</span>';
    related = '<span class="word">会社</span>・<span class="word">給料</span>';
}

 // ---------- 画面に出す ----------
 $("#word").val(word);        // 検索ボックスにも言葉を入れる
 $("#center").text(term);     // 真ん中の ? に統制語
 $("#upper").html(upper);     // .html() は、span などのタグも生かして入れる
 $("#lower").html(lower);
 $("#similar").html(similar);
 $("#related").html(related);

 console.log(word + " → " + term);
}

// ============================================
// 動き2:マップの中の言葉をクリックしたら
// ============================================
// ページの準備ができたら、クリックの見はりを始める(jQueryのお決まり)
$(function () {
 // あとから入れた言葉にも効くように、$(document).on を使う
 $(document).on("click", ".word", function () {
   var word = $(this).text();   // $(this) =「いまクリックされた言葉」
   searchWord(word);            // 同じ関数を呼ぶ
 });
});

// wikidataとのAPI連携
function searchWikidata(word) {
    //1_問い合わせ先
    var url ="https://www.wikidata.org/w/api.php";

    // 2_待っている際の表示
    $('#description').text("wikidataで調べています...")

    // 3 APIに聴きに行って、JSONデータで受け取る 聞きにいく中身は{}にまとめる
    $.getJSON(url, {
        action: "wbsearchentities",
        search: word,
        language:"ja",
        uselang:"ja",
        format:"json",
        origin:"*"
    }, function (data) {
        //4 見つからなかったとき 
        if (data.search.length === 0) {
            $("#description").text("wikidataには見つかりませんでした");
            return;
        }
        // 5 １件目の説明を画面に出す
        var first = data.search[0];
        var text = first.description || "説明はまだありません";
        $("#description").text(first.label + ":" + text +"(出典:wikidata)");
    }).fail(function(){
        // 6 通信を失敗した時。
        $("#description").text("wikidataには繋がりませんでした")
    });
}
testtest
