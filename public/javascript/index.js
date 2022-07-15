rows=document.getElementsByClassName("groupsChat");
len=rows.length;
for(var i=0;i<len;i++){
    rows[i].addEventListener("click",function(event){
        groupName=event.target.parentElement.parentElement.firstElementChild.innerText;
        // console.log(groupName);
        window.location.href = "/chat/"+groupName;
    });
}

toDelete=document.getElementsByClassName("deleteChat");
len2=toDelete.length;
for(var i=0;i<len2;i++){
    toDelete[i].addEventListener("click",function(event){
        groupName=event.target.parentElement.parentElement.firstElementChild.innerText;
        
        document.getElementById("groupName").value=groupName;
        document.getElementById("groupNameH2").innerText=groupName;
        
        $('#deleteWarning').modal('toggle');
    });
}