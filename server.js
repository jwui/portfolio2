const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const moment = require("moment");
const momentTimezone = require("moment-timezone");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const multer = require("multer");

const app = express();
const port = process.env.PORT || 5000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: "secret", resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

MongoClient.connect(
  "mongodb+srv://admin:Qwe3834poi^(@testdb.d3uk0xi.mongodb.net/?retryWrites=true&w=majority",
  function (err, result) {
    //에러가 발생했을경우 메세지 출력(선택사항)
    if (err) {
      return console.log(err);
    }

    //위에서 만든 db변수에 최종연결 ()안에는 mongodb atlas 사이트에서 생성한 데이터베이스 이름
    db = result.db("testdb");

    //db연결이 제대로 됐다면 서버실행
    app.listen(port, function () {
      console.log("서버연결 성공");
    });
  }
);

app.get("/", function (req, res) {
  res.render("index", { userData: req.user }); //로그인시 회원정보데이터 ejs 파일로 전달
});

app.get("/", function (req, res) {
  res.render("index", { userData: req.user }); //로그인시 회원정보데이터 ejs 파일로 전달
});

app.get("/donation", function (req, res) {
  res.render("donation"); //로그인시 회원정보데이터 ejs 파일로 전달
});

//  /loginresult 경로 요청시 passport.autenticate() 함수구간이 아이디 비번 로그인 검증구간
passport.use(
  new LocalStrategy(
    {
      usernameField: "adminId",
      passwordField: "adminPass",
      session: true,
      passReqToCallback: false,
    },
    function (id, pass, done) {
      // console.log(userid, userpass);
      db.collection("port2_user").findOne(
        { adminId: id },
        function (err, result) {
          if (err) return done(err);

          if (!result)
            return done(null, false, {
              message: "존재하지않는 아이디 입니다.",
            });
          if (pass == result.adminPass) {
            return done(null, result);
          } else {
            return done(null, false, { message: "비번이 틀렸습니다" });
          }
        }
      );
    }
  )
);

//처음 로그인 했을 시 해당 사용자의 아이디를 기반으로 세션을 생성함
//  req.user
passport.serializeUser(function (user, done) {
  done(null, user.adminId); //서버에다가 세션만들어줘 -> 사용자 웹브라우저에서는 쿠키를 만들어줘
});

// 로그인을 한 후 다른 페이지들을 접근할 시 생성된 세션에 있는 회원정보 데이터를 보내주는 처리
// 그전에 데이터베이스 있는 아이디와 세션에 있는 회원정보중에 아이디랑 매칭되는지 찾아주는 작업
passport.deserializeUser(function (adminId, done) {
  db.collection("port2_user").findOne(
    { adminId: adminId },
    function (err, result) {
      done(null, result);
    }
  );
});

//파일첨부

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/upload");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      (file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      ))
    );
  },
});
const upload = multer({ storage: storage });
//커피 메뉴 페이지
app.get("/menu/coffee", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "커피" })
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});

//도넛 메뉴 페이지
app.get("/menu/donuts", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "도넛" })
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});
//음료 메뉴 페이지
app.get("/menu/beverage", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "음료" })
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});

//샌드위치 메뉴 페이지
app.get("/menu/sandwiches", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "샌드위치" })
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});

//전체 메뉴 페이지
app.get("/menu", (req, res) => {
  db.collection("port2_prdlist")
    .find({})
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});

//상품 상세페이지 get 요청
app.get("/menudetail/:no", (req, res) => {
  db.collection("port2_prdlist").findOne(
    { num: Number(req.params.no) },
    (err, result1) => {
      db.collection("port2_prdlist")
        .find({ category: result1.category })
        .toArray((err, result2) => {
          res.render("menu_detail", { currentNum: result1, prdData: result2 });
        });
    }
  );
});

//관리자 매장등록 화면 페이지
app.get("/admin/storelist", (req, res) => {
  db.collection("port2_storelist")
    .find({})
    .toArray((err, result) => {
      res.render("admin_store", {
        storeData: result,
        userData: req.user,
      });
    });
}); //admin_store.ejs 파일로 응답

//관리자 매장 삭제처리 get 요청
app.get("/deletestore/:no", function (req, res) {
  //db안에 해당 매장 번호에 맞는 데이터만 삭제 처리
  db.collection("port2_storelist").deleteOne(
    { num: Number(req.params.no) },
    function (err, result) {
      //매장 목록페이지로 이동
      res.redirect("/admin/storelist");
    }
  );
});

//매장등록페이지에서 전송한 값 데이터베이스에 삽입
app.post("/addstore", (req, res) => {
  db.collection("port2_count").findOne({ name: "매장등록" }, (err, result1) => {
    db.collection("port2_storelist").insertOne(
      {
        num: result1.storeCount + 1,
        name: req.body.name,
        sido: req.body.city1,
        sigugun: req.body.city2,
        address: req.body.detail,
        phone: req.body.phone,
      },
      (err, result) => {
        db.collection("port2_count").updateOne(
          { name: "매장등록" },
          { $inc: { storeCount: 1 } },
          (err, result) => {
            res.redirect("/admin/storelist"); //매장등록 페이지로 이동
          }
        );
      }
    );
  });
});

//매장 수정화면 페이지 get 요청
app.get("/storeupt/:no", function (req, res) {
  //db안에 해당 게시글번호에 맞는 데이터를 꺼내오고 ejs파일로 응답
  db.collection("port2_storelist").findOne(
    { num: Number(req.params.no) },
    function (err, result) {
      res.render("storeupt", {
        storeData: result,
        userData: req.user,
      });
    }
  );
  //input, textarea에다가 작성내용 미리 보여줌
});

app.post("/updatestore", function (req, res) {
  db.collection("port2_storelist").updateOne(
    { num: Number(req.body.num) },
    {
      $set: {
        name: req.body.name,
        sido: req.body.sido,
        sigugun: req.body.sigugun,
        address: req.body.address,
        phone: req.body.phone,
      },
    },
    //해당 게시글 상세화면 페이지로 이동
    function (err, result) {
      res.redirect("/admin/storelist");
    }
  );
});

//관리자 화면 로그인 페이지
app.get("/admin", (req, res) => {
  res.render("admin_login"); // admin_login.ejs 파일로 응답
});

//뉴스 화면 페이지
app.get("/news", (req, res) => {
  res.render("news");
});

//브랜드스토리 로그인 페이지
app.get("/story", (req, res) => {
  res.render("story"); // story.ejs 파일로 응답
});

//관리자 화면 로그인 유무 확인
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  (req, res) => {
    res.redirect("/admin/prdlist");
    //로그인 성공시 관리자 상품등록 페이지로 이동
  }
);

//로그인 실패시 fail경로
app.get("/fail", (req, res) => {
  res.send("로그인 실패");
});

//관리자 상품등록 페이지
app.get("/admin/prdlist", (req, res) => {
  //db에 저장되어있는 상품목록들 find 찾아와서 전달
  db.collection("port2_prdlist")
    .find({})
    .toArray((err, result) => {
      res.render("admin_prdlist", { prdData: result, userData: req.user });
    });
});

//상품 삭제처리 get 요청
app.get("/delete/:no", function (req, res) {
  //db안에 해당 게시글 번호에 맞는 데이터만 삭제 처리
  db.collection("port2_prdlist").deleteOne(
    { num: Number(req.params.no) },
    function (err, result) {
      //게시글 목록페이지로 이동
      res.redirect("/admin/prdlist");
    }
  );
});

//상품 수정화면 페이지 get 요청
app.get("/prdupt/:no", function (req, res) {
  //db안에 해당 게시글번호에 맞는 데이터를 꺼내오고 ejs파일로 응답
  db.collection("port2_prdlist").findOne(
    { num: Number(req.params.no) },
    function (err, result) {
      res.render("prdupt", {
        prdData: result,
        userData: req.user,
      });
    }
  );
  //input, textarea에다가 작성내용 미리 보여줌
});

app.post("/updateprd", upload.single("thumbfile"), function (req, res) {
  //db에 해당 게시글 번호에 맞는 게시글 수정처리
  if (req.file) {
    fileUpload = req.file.originalname;
  } else {
    fileUpload = req.body.fileOrigin;
  }

  db.collection("port2_prdlist").updateOne(
    { num: Number(req.body.num) },
    {
      $set: {
        name: req.body.name,
        thumbnail: fileUpload,
        category: req.body.category,
        detail: req.body.detail,
      },
    },
    //해당 게시글 상세화면 페이지로 이동
    function (err, result) {
      res.redirect("/admin/prdlist");
    }
  );
});

//상품을 DB에 넣는 경로 //첨부한 이미지 name값
app.post("/add/prdlist", upload.single("thumbnail"), (req, res) => {
  //파일첨부가 있을 때
  if (req.file) {
    fileTest = req.file.originalname;
  }
  //파일첨부가 없을 때
  else {
    fileTest = null;
  }
  db.collection("port2_count").findOne({ name: "상품등록" }, (err, result1) => {
    db.collection("port2_prdlist").insertOne(
      {
        num: result1.prdCount + 1,
        name: req.body.name,
        thumbnail: fileTest,
        category: req.body.category,
        detail: req.body.detail,
      },
      (err, result) => {
        db.collection("port2_count").updateOne(
          { name: "상품등록" },
          { $inc: { prdCount: 1 } },
          (err, result) => {
            res.redirect("/admin/prdlist"); //상품등록 페이지로 이동
          }
        );
      }
    );
  });
});

//관리자 뉴스등록 페이지
app.get("/admin/newslist", (req, res) => {
  //db에 저장되어있는 상품목록들 find 찾아와서 전달
  db.collection("port2_newsboard")
    .find({})
    .toArray((err, result) => {
      res.render("admin_newslist", { newsData: result, userData: req.user });
    });
});

//뉴스 삭제처리 get 요청
app.get("/deletenews/:no", function (req, res) {
  //db안에 해당 게시글 번호에 맞는 데이터만 삭제 처리
  db.collection("port2_newsboard").deleteOne(
    { number: Number(req.params.no) },
    function (err, result) {
      //게시글 목록페이지로 이동
      res.redirect("/admin/newslist");
    }
  );
});

//뉴스 수정화면 페이지 get 요청
app.get("/newsupt/:no", function (req, res) {
  //db안에 해당 게시글번호에 맞는 데이터를 꺼내오고 ejs파일로 응답
  db.collection("port2_newsboard").findOne(
    { number: Number(req.params.no) },
    function (err, result) {
      res.render("newsupt", {
        newsData: result,
        userData: req.user,
      });
    }
  );
  //input, textarea에다가 작성내용 미리 보여줌
});

app.post("/updatenews", upload.single("thumbfile"), function (req, res) {
  //db에 해당 게시글 번호에 맞는 게시글 수정처리
  if (req.file) {
    fileUpload = req.file.originalname;
  } else {
    fileUpload = req.body.fileOrigin;
  }

  db.collection("port2_newsboard").updateOne(
    { number: Number(req.body.num) },
    {
      $set: {
        title: req.body.title,
        thumbnail: fileUpload,
        context: req.body.context,
      },
    },
    //해당 게시글 상세화면 페이지로 이동
    function (err, result) {
      res.redirect("/admin/newslist");
    }
  );
});

//뉴스를 DB에 넣는 경로 //첨부한 이미지 name값
app.post("/add/newslist", upload.single("thumbnail"), (req, res) => {
  //파일첨부가 있을 때
  if (req.file) {
    fileTest = req.file.originalname;
  }
  //파일첨부가 없을 때
  else {
    fileTest = null;
  }
  db.collection("port2_count").findOne({ name: "뉴스등록" }, (err, result1) => {
    db.collection("port2_newsboard").insertOne(
      {
        number: result1.newsCount + 1,
        title: req.body.title,
        context: req.body.context,
        thumbnail: fileTest,
      },
      (err, result) => {
        db.collection("port2_count").updateOne(
          { name: "뉴스등록" },
          { $inc: { newsCount: 1 } },
          (err, result) => {
            res.redirect("/admin/newslist"); //상품등록 페이지로 이동
          }
        );
      }
    );
  });
});

//매장 검색 화면 페이지(사용자)
app.get("/store", (req, res) => {
  db.collection("port2_storelist")
    .find({})
    .toArray((err, result) => {
      res.render("store", { storeData: result });
    });
});

//매장 지역검색 결과화면 페이지(사용자)
app.get("/search/local", (req, res) => {
  //시/도 선택시
  if (req.query.city1 !== "" && req.query.city2 === "") {
    db.collection("port2_storelist")
      .find({ sido: req.query.city1 })
      .toArray((err, result) => {
        res.render("store", { storeData: result });
      });
  }
  //시/도 구/군 선택시
  else if (req.query.city1 !== "" && req.query.city2 !== "") {
    db.collection("port2_storelist")
      .find({ sido: req.query.city1, sigugun: req.query.city2 })
      .toArray((err, result) => {
        res.render("store", { storeData: result });
      });
  }
  //아무것도 선택하지 않았을때
  else {
    res.redirect("/store");
  }
});

//매장명으로 검색시 (사용자)
app.get("/search/storename", (req, res) => {
  //query: <-- store.ejs 파일에서 입력한 input text -> req.query.name
  //path: <-- db storelist 콜렉션에서 어떤 항목명으로 찾을건지 name

  let storeSearch = [
    {
      $search: {
        index: "store_search",
        text: {
          query: req.query.name,
          path: "name",
        },
      },
    },
  ];
  //검색어 입력시
  if (req.query.name !== "") {
    db.collection("port2_storelist")
      .aggregate(storeSearch)
      .toArray((err, result) => {
        res.render("store", { storeData: result });
      });
  }
  //검색어 미입력시
  else {
    res.redirect("/store");
  }
});

app.get("/newsboard", async (req, res) => {
  //사용자가 게시판에 접속시 몇번 페이징 번호로 접속했는지 확인
  let pageNum = req.query.page == null ? 1 : Number(req.query.page);
  //한 페이지당 보여줄 데이터 갯수
  let perPage = 5;
  //블록당 보여줄 페이징 번호 갯수
  let blockCount = 3;
  //현재 페이지 블록 구하는 구간
  let blockNum = Math.ceil(pageNum / blockCount);
  //블록안에 있는 페이징의 시작번호 값
  let blockStart = (blockNum - 1) * blockCount + 1;
  //블록안에 있는 페이징의 끝번호 값
  let blockEnd = blockStart + blockCount - 1;
  //데이터베이스 콜렉션에 있는 전체 객체의 갯수값 가져오는 명령어
  let totalData = await db.collection("port2_newsboard").countDocuments({});
  //전체 데이터값을 통해서 전체 페이징 번호를 계산
  let paging = Math.ceil(totalData / perPage);
  //블록에서 마지막 번호가 페이징의 끝번호보다 크다면, 페이징의 끝번호를 강제로 부여
  if (blockEnd > paging) {
    blockEnd = paging;
  }

  //블록의 총 갯수 계산
  let totalBlock = Math.ceil(paging / blockCount);
  //데이터베이스에서 꺼내오는 데이터의 순번값을 결정
  //데이터베이스 콜렉션에서 데이터를 perPage 갯수만큼 맞춰서 가져오기
  let startFrom = (pageNum - 1) * perPage;
  //sort({정렬할 프로퍼티명:1}) 오름차순 -1은 내림차순
  //조건문을 이용해서 입력한 검색어가 있는 경우는 aggregate({}).sort().skip().limit()
  db.collection("port2_newsboard")
    .find({})
    .sort({ number: -1 })
    .skip(startFrom)
    .limit(perPage)
    .toArray((err, result) => {
      res.render("newsbrd", {
        newsData: result,
        paging: paging,
        pageNum: pageNum,
        blockStart: blockStart,
        blockEnd: blockEnd,
        blockNum: blockNum,
        totalBlock: totalBlock,
      });
    });
});
