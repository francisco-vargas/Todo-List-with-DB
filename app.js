//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ("mongoose");
const _ = require ("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.set('strictQuery', false);

mongoose.connect("mongodb+srv://admin-Chisco:test123@cluster0.oa3tz.mongodb.net/todolistDB", {useNewUrlParser:true});


// new items Schema
const itemsSchema = {
  name : String
};

// new Mongoose model.  This creates a new collection
const Item = mongoose.model("item", itemsSchema);

// new default items, added through Mongoose documents
const item1 = new Item({
  name: "Welcome to your Todo list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// constant holding the documents into an array
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems){

    if (foundItems.length === 0) {
      // add all the documents into the items collection
      Item.insertMany(defaultItems);

      res.redirect("/");
    } else {
      res.render("list", {
           listTitle: "Today",
           newListItems: foundItems
      });
    }

  });

});

app.get("/:customListName", function(req, res) {

  const customListName =  _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(foundList => {
    if (foundList) {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      })
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName);
    }
  }).catch(err => console.log(err.body));

});

app.post("/", function(req, res){

     const itemName = req.body.newItem;
     const listName = req.body.list;

     const item = new Item ({
       name: itemName
     });

     if (listName === "Today"){
       item.save();
       res.redirect("/");
     } else {
       List.findOne({name: listName}).then(function(foundList) {
         foundList.items.push(item);
         foundList.save();

         res.redirect("/" + listName);
       });
     }

});

app.post("/delete", function(req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
      Item.deleteOne({_id: checkedItemId}).then(function(){
        console.log("Successfully deleted");
        res.redirect("/");
      })
    } else {
      List.findOneAndUpdate({name: listName}, {
        $pull: {items: {_id: checkedItemId}}
      }).then(function (foundList)
      {
        res.redirect("/" + listName);
      }).catch( err => console.log(err));
    }

});

app.get("/about", function(req, res){
     res.render("about");
})

app.listen(3000, function() {
     console.log("Server started on port 3000");
});
