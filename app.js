//  Dependancies

const express=require('express');
const app=express();
const http=require('http');
const server=http.createServer(app);
const bp=require('body-parser');
const mongoose=require('mongoose');
const ejs=require('ejs');
const md5=require('md5');
const session=require('express-session');
const async=require('async');
const { Server }=require('socket.io');
const io=new Server(server);



mongoose.connect("mongodb://localhost:27017/AnonymX");



app.use(bp.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(session({
    secret:'this is the secret',
    resave:false,
    saveUninitialized:false

}));
app.use(function(req, res, next) {
    res.locals.username = req.session.username;
    res.locals.email=req.session.email;
    next();
});




// Dependancies

const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    groupList:Array
});
const groupSchema=new mongoose.Schema({
    groupName:String,
    groupDesc:String,
    groupAdmin:userSchema,
    messages:{
        type:Array
    }

});

const User=mongoose.model("User",userSchema);
const Group=mongoose.model("Group",groupSchema);










app.get("/",(req,res)=>{
    res.render("index");
});
app.get("/signup",(req,res)=>{
    res.render("signup");
});

app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/terms",(req,res)=>{
    res.sendFile(__dirname+"/terms.txt");
})
app.post("/signup",(req,res)=>{
    name=req.body.name;
    email=req.body.email;
    password=md5(req.body.password);
    cpassword=md5(req.body.cpassword);
    User.findOne(
        {email:email},
        function(err,foundUser){
            if(err){
                console.log(err);
            }
            else if(foundUser){
                res.render("signup",{errorsign:1});
            }
            else if(password==cpassword){
                const newUser=new User(
                    {
                        name:name,
                        email:email,
                        password:password
                    }
                );
                newUser.save();
                res.render("serverMessage",{message:1}); // Account Successfully Created
            }
            else{
                res.render("signup",{errorsign:2});
            }
        }
    )
});



app.post("/login",(req, res)=>{
 

    email=req.body.email;
    password=md5(req.body.password);
    User.findOne(
        {email:email},
        function(err,foundUser){
            if(err){
                console.log(err);
            }else if(foundUser){
                if(foundUser.password==password){
                    req.session.username=foundUser.name;
                    req.session.email=foundUser.email;
                    res.redirect("/dashboard");
                }else{
                    res.render("login",{errorlog:2});
                    
                }
            }else{
                res.render("login",{errorlog:1});
                
            }
            
        }
        
        );
});


app.get("/dashboard",(req,res)=>{

    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means accessing dashboard without login
    }
    else{
        res.render("dashboard");
        
    }

});
app.get("/mygroups",(req,res)=>{

    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means accessing Groups without login
    }else{
        var currentUser;
        User.find(
            {email:req.session.email},
            function(err,user){
                if(err){
                    console.log(err);
                }else{
                    currentUser=user;
                    var userGroupList=currentUser[0].groupList;
                    res.render("mygroups",{userGroupList:userGroupList});
                }
            }
        );
        
    }

});
app.get("/createGroup",(req,res)=>{

    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means creating Groups without login
    }
    else{
        res.render("createGroupForm");
        
    }

});
app.post("/createGroup",(req,res)=>{
    let groupAdmin;
    User.findOne(
        {email:req.session.email},
        function(err,user){
            if(err){
                console.log(err);
            }else{
                groupAdmin=user;
            }
        }
    );
    let groupName=req.body.groupName;
    let groupDesc=req.body.groupDesc;
    Group.findOne(
        {groupName:groupName},
        function(err,foundGroup){
            if(err){
                console.log(err);
            }else if(foundGroup){
                res.render("createGroupForm",{messagelog:1});
            }else if(!foundGroup){
                let newGroup=new Group({
                    groupName: groupName,
                    groupDesc: groupDesc,
                    groupAdmin: groupAdmin,
                });
                newGroup.save();
                User.updateOne(
                    {email:req.session.email},
                    {$push:{groupList:newGroup}},
                    function(err){
                        if(err){
                            console.log(err);
                        }
                    }
                )
                res.render("createGroupForm",{messagelog:2});
            }
        }
    )
    
    
});


app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/login");
        }
    })
});

app.get("/chat/:groupName",(req,res)=>{
    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means accessing Chats without login
    }
    else{
        let groupName=req.params.groupName;
        let messages;
        Group.findOne(
            {groupName:groupName},
            function(err,foundGroup){
                if(err){
                    console.log(err);
                }
                else{
                    messages=foundGroup.messages;
                    res.render("chat",{groupName:groupName,messages:messages});
                }
            }
        );
        io.on('connection', (socket) => {
            
            
            
          });
        
        
    }
});

app.post("/chat",(req,res)=>{
    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means accessing Chats without login
    }
    else{
        let message=req.body.message;
        let groupName=req.body.groupName;
        Group.updateOne(
            {groupName:groupName},
            {$push:{messages:message}},
            function(err){
                if(err){
                    console.log(err);
                }
            }
        );
       
        io.emit('chat');
        res.redirect("/chat/"+groupName);
        
        
        
    }
});

app.post("/deleteGroup",(req,res)=>{
    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means accessing Chats without login
    }
    else{
        let groupName=req.body.groupName;
        let userEmail=req.session.email;
        User.updateOne(
            {email:userEmail},
            { $pull: { groupList: {groupName:groupName} } },
            function(err){
                if(err){
                    console.log(err);
                }
            }
        );
        res.redirect("/mygroups");
        
        
        
    }
});

app.get("/searchGroup",(req,res)=>{
    // Check Session is loggedin or not 
    if(typeof req.session.username == "undefined"){
        res.render('serverMessage',{message:3}); // message 3 means accessing Chats without login
    }
    else{
        res.render("searchgroup");
    }
});
app.post("/searchGroup",(req,res)=>{
    var groupName=req.body.groupName;
    Group.findOne(
        {groupName:groupName},
        function(err,foundGroup){
            if(err){
                console.log(err);
            }else if(foundGroup){
                res.render("searchgroup",{message:1,groupName:groupName}); // Group Is Available
            }else{
                res.render("searchgroup",{message:2,groupName:groupName}); // Group Does Not Exist
            }
        }
    );
    
});

app.post("/addMe",(req,res)=>{
    var groupName=req.body.groupName;
    var userEmail=req.session.email;
    Group.findOne(
        {groupName:groupName},
        function(err,foundGroup){
            if(err){
                console.log(err);
            }else if(foundGroup){
                User.updateOne(
                    {email:userEmail},
                    {$push:{groupList:foundGroup}},
                    function(err){
                        if(err){
                            console.log(err);
                            res.render("searchgroup",{message:3}); // Server Error in adding user
                        }
                        else{
                            res.redirect("/mygroups");
                        }
                    }
                )
            }
        }
    )
    
});

server.listen(3000,(req,res)=>{
    console.log("Server Running on port 3000");
});
// app.get('/locals',(req,res)=>{
//     console.log(res.locals);
//     res.redirect("/dashboard");
// });