const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config(); // for .env file

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_CONNECT, {
  useNewUrlParser: true,
});

const itemSchema = {
  name: String,
};

const customListSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", customListSchema);

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your Todo-list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("all good");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", (req, res) => {
  var customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listname = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listname === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listname }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listname);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (!err) {
        Item.findByIdAndRemove(checkedItemID, function (err) {
          res.redirect("/");
        });
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } },
      function (err, foundOne) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
