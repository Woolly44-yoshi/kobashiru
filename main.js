// 調べるぽボタンを教えたらhtmlのonclick="showMap()"から呼ばれる
    /* word という箱をつくって(var)、入力欄の中身を取り出して(val)入れる」
    覚え方: var = 箱をつくる、val = 中身を取り出す */
    /* 英語の variable(ヴァリアブル=変数)の略 */
    /* 英語の value(バリュー=値)の略 */
function showMap() {
    var word = $('#word').val(); /* 入力文をとる */
    searchWord(word);/* 調べる関数をとる */
}

// ①初めの実装：ぴったりの言葉がきたら統制語にする
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
        $("#center").text(word); /* 真ん中に、入力した言葉をそのまま出す */
        $("#upper").text("-");
        $("#lower").text("-");
        $("#similar").text("-");
        $("#related").text("-");
        $("#lower").text("-");
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
        searchAliases(first.id); /* 類語(別名)も聞きに行く */
        searchUpper(first.id); /* 上位語も聞きに行く */
        searchLower(first.id); /* 下位語も聞きに行く */
        searchRelated(first.label); /* 関連語も聞きに行く(Wikipedia) */
        var text = first.description || "説明はまだありません";
        $("#description").text(first.label + ":" + text +"(出典:wikidata)");
    }).fail(function(){
        // 6 通信を失敗した時。
        $("#description").text("wikidataには繋がりませんでした")
    });
}

// 🧠設計(短く)
// Wikidataの言葉には 番号(id) があります(例: ネコ = Q146)。その番号で聞くと「別名」がもらえるので、それを類語として使います。
// 手順: 番号を送る → 別名をもらう → 3つまで「・」でつなぐ → 類語の箱に出す
// ※ ステップ1が終わっている前提の行番号です。

// ステップ2:類語をWikidataからもらう
    function searchAliases(id) {
        var url ="https://www.wikidata.org/w/api.php";

        /* 2 ID(146)を送って、日本語の別名をもらう */
        $.getJSON(url,{
            action:"wbgetentities",
            ids:id,
            props:"aliases",
            language:"ja",
            format:"json",
            origin:"*",
        },function(data){
            /* 3,登録ずみの言葉が入ってる時は何もしない */
            if ($("#similar").text() !=="-") {
                return;
            }
            /* 4 日本語の別名リストを取り出す。なければ終わり */
        var aliases = data.entities[id].aliases.ja;
        if (aliases ===undefined) {
            return;
        }
        // ５ 別名を３つまで、クリックできるように言葉にしてつなげる
        var similar ="";
        for (var i = 0; i < aliases.length && i < 3; i++) {
            if (i > 0){
                similar = similar + "・";
            }
            similar  = similar + '<span class="word">' + aliases[i].value + '</span>';
        }
        // 6 類語の箱に出す
        $("#similar").html(similar);
    });
}

// wikidataから上位語(〜の一種)をもらう
// searchUpper(サーチ・アッパー)… search=さがす + upper=上の →「上位語をさがす」
function searchUpper(id) {
    // 1_問い合わせ先(url=インターネット上の住所)
    var url = "https://www.wikidata.org/w/api.php";

    // 2 id(Q146など)を送って、claims(クレームズ=主張・事実のリスト)をもらう
    //   なぜ? 「〜の一種」という情報は claims の中に入っているから
    $.getJSON(url, {
        action: "wbgetentities",   // 番号から項目の情報をちょうだい
        ids: id,                   // どの番号か
        props: "claims",           // props(性質)… 事実のリストだけほしい
        format: "json",
        origin: "*"
    }, function (data) {
        // 3 登録済みの言葉(上位語がもう入っている)ときは、何もしない
        //   なぜ? 犬・好き・仕事は自分で決めた上位語を優先したいから
        if ($("#upper").text() !== "-") {
            return;
        }
        // 4 P279(〜の下位クラス)を取る。なければ P31(〜の一種)を使う
        //   P(ピー)= property(プロパティ=性質)の番号。Wikidataでは「上位」がこの2つで表される
        //   ||(または)… 左がなければ右を使う
        var claims = data.entities[id].claims;
        var list = claims.P279 || claims.P31;
        // undefined(アンディファインド=何もない)なら終わり。なぜ? 上位語がない言葉もあるから
        if (list === undefined || list[0].mainsnak.datavalue === undefined) {
            return;
        }
        // 5 1つ目の上位語の番号を取り出す
        //   mainsnak(メインスナック)… その事実の本体 / datavalue(データバリュー)… 値 / value.id … 番号
        var upperId = list[0].mainsnak.datavalue.value.id;

        // 6 その番号の「日本語の名前」をもう一度聞きに行く
        //   なぜ? claimsには番号(Q228283など)しか入っていないので、名前は別にもらう必要がある
        $.getJSON(url, {
            action: "wbgetentities",
            ids: upperId,
            props: "labels",       // labels(レーベルズ=名前)だけほしい
            languages: "ja",       // 日本語で
            format: "json",
            origin: "*"
        }, function (data2) {      // data2 … 2回目の返事(1回目の data と区別するため)
            var label = data2.entities[upperId].labels.ja;
            // 日本語の名前がなければ終わり
            if (label === undefined) {
                return;
            }
            // 7 クリックできる言葉にして、上位語の箱に出す
            //   なぜ <span class="word">? クリックで再検索できるようにするため
            $("#upper").html('<span class="word">' + label.value + '</span>');
        });
    });
}

// wikidataから下位語(具体例)をもらう
// searchLower(サーチ・ロウワー)… search=さがす + lower=下の →「下位語をさがす」
function searchLower(id) {
    // 1_問い合わせ先
    //   query(クエリ=質問)の窓口。なぜ別の住所? 「〇〇の一種はどれ?」という逆向きの質問は、
    //   ふつうの窓口(api.php)ではできず、質問専用の窓口(sparql)が必要だから
    var url = "https://query.wikidata.org/sparql";

    // 2 質問文を作る(SPARQL=スパークル。Wikidataに質問するための専用の文)
    //   日本語にすると「id の下位クラス(P279)になっている項目の、日本語の名前を3つ教えて」
    //   SELECT(セレクト=選ぶ)… 何がほしいか / WHERE(ウェア=どこで)… 条件
    //   FILTER(フィルター=しぼる)… 日本語(ja)だけ / LIMIT(リミット=上限)… 3つまで
    var query = 'SELECT ?label WHERE { ' +
                '?item wdt:P279 wd:' + id + ' . ' +
                '?item rdfs:label ?label . ' +
                'FILTER(LANG(?label) = "ja") ' +
                '} LIMIT 3';

    // 3 質問を送る
    $.getJSON(url, {
        query: query,              // 質問文
        format: "json"             // JSONの形で返してね
    }, function (data) {
        // 4 登録済みの言葉(下位語がもう入っている)ときは、何もしない
        //   なぜ? 犬・好き・仕事は自分で決めた下位語を優先したいから
        if ($("#lower").text() !== "-") {
            return;
        }
        // 5 答えのリストを取り出す。0件なら終わり
        //   results(リザルツ=結果)/ bindings(バインディングス=答えの1行1行)
        var list = data.results.bindings;
        if (list.length === 0) {
            return;
        }
        // 6 for文で、クリックできる言葉にしてつなげる(ステップ2と同じ形)
        var lower = "";
        for (var i = 0; i < list.length; i++) {
            if (i > 0) {
                lower = lower + "・";
            }
            lower = lower + '<span class="word">' + list[i].label.value + '</span>';
        }
        // 7 下位語の箱に出す
        $("#lower").html(lower);
    });
}

// wikipediaから関連語をもらう
// searchRelated(サーチ・リレイティッド)… search=さがす + related=関連した →「関連語をさがす」
// (label)… 材料。Wikidataでの正式な名前(例: ネコ)。なぜ? Wikipediaの記事名と同じことが多いから
function searchRelated(label) {
    // 1_問い合わせ先(日本語版Wikipediaの窓口)
    //   なぜWikipedia? 「この記事に似ている記事」をさがす機能があり、無料・登録なしで使えるから
    var url = "https://ja.wikipedia.org/w/api.php";

    // 2 「似ている記事を3つ」と聞く
    $.getJSON(url, {
        action: "query",                 // query(クエリ=質問)する
        list: "search",                  // search(サーチ=検索)の結果リストがほしい
        srsearch: "morelike:" + label,   // morelike(モアライク=もっと似ている)… この記事に似ている記事
                                         //   sr = search の略
        srlimit: 3,                      // 3つまで(limit=上限)
        format: "json",
        origin: "*"                      // ブラウザから使うためのお約束
    }, function (data) {
        // 3 登録済みの言葉(関連語がもう入っている)ときは、何もしない
        if ($("#related").text() !== "-") {
            return;
        }
        // 4 答えがない・0件なら終わり
        //   なぜ data.query === undefined も見る? 記事がない言葉だと、query自体が返ってこないことがあるから
        if (data.query === undefined || data.query.search.length === 0) {
            return;
        }
        var list = data.query.search;
        // 5 for文で、記事のタイトル(title=題名)をクリックできる言葉にしてつなげる
        var related = "";
        for (var i = 0; i < list.length; i++) {
            if (i > 0) {
                related = related + "・";
            }
            related = related + '<span class="word">' + list[i].title + '</span>';
        }
        // 6 関連語の箱に出す
        $("#related").html(related);
    });
}

// 11/14_リッチ課題

$(function(){
    console.log("1_ページの準備ができた");

    $(".js-click-showSlideModal").on("click", function(){
        console.log("2_ボタンが押された")

        $(".js-target-slideModal").toggleClass("show");
        console.log("3_ウインドが開いた")
    });
});

// 要素の取得
const label = $(".label");  
const dropzone = document.getElementById('dropzone')
console.log(dropzone)

$(function () {
    // ① 言葉(.word)にマウスがのったら、つかめるようにする
    /* $(document)はページ全体_on("mouseenter", ".word"_マウスが言葉に乗ったら
       $(this)_マウスが乗ったその言葉を  */

    $(document).on("mouseenter", ".word", function () {
      $(this).draggable({
         helper: "clone", /* クローンを使う */
         revert: "invalid", /* revert(リバート)= もとにもどるinvalid(インバリッド)= ダメな場所(提出箱ではない場所) */
         appendTo: "body", /* 「コピーを、ページのいちばん外側に置く」 */
         zIndex: 1000
        });
    });
    console.log("言葉つかめました")
  
    // ② dropzone に落とされたら、お気に入りリストに足す
    $("#dropzone").droppable({
      accept: ".word",        // .word だけ受けつける
      hoverClass: "hover",    // 上にきたら .hover の札をつける
      drop: function (e, ui) {
        console.log("② 落とされた");
        
        var text = ui.draggable.text();   // 落とされた言葉
        $("#favorite-list").append("<li>" + text + "</li>");
        console.log(text + " をお気に入りに入れた");
        console.log("③ " + text + " をお気に入りに入れた");
      }
    });
  });