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

//쿠키 메뉴 페이지
app.get("/menu/cookie", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "쿠키" })
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});
//케이크 메뉴 페이지
app.get("/menu/cake", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "케이크" })
    .toArray((err, result) => {
      res.render("menu", { prdData: result });
    });
});

//브레드 메뉴 페이지
app.get("/menu/bread", (req, res) => {
  db.collection("port2_prdlist")
    .find({ category: "브레드" })
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

//관리자 화면 로그인 페이지
app.get("/admin", (req, res) => {
  res.render("admin_login"); // admin_login.ejs 파일로 응답
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

//게시글 삭제처리 get 요청
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
