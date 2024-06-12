//Make the first letter of text to uppercase
var firstLetterUpper = function(text) {
    return text.substring(0, 1).toUpperCase()+text.substring(1, text.length);
};

//Text Formatting: chanel cologne => Chanel Cologne
var textFormatting = function(text) {
    var textArr = text.toLowerCase().split(" ");
    textArr = textArr.map(function(text) {
        return firstLetterUpper(text);
    });
    return textArr.join(" ");
};

//Product Object
var Product = function(upc, brand, name, category, product_type, shelfLife) {
    this.upc = upc;
    this.brand = brand;
    this.name = name;
    this.category = category;
    this.product_type = product_type;
    this.shelfLife = shelfLife;
};

Product.prototype.getFullName = function() {
    return this.brand + " " + this.name;
};

//Object for products registered in User database
var UserProduct = function(product, expirationDate, openingDate) {
    this.product = product;
    this.expirationDate = expirationDate;
    this.openingDate = openingDate;
};

//Options used for select type input
var skincareOptions = '<option id="cleansers" value="cleansers" selected>Cleansers</option><option id="eyeCare" value="eyeCare">Eye Care</option><option id="lipTreatments" value="lipTreatments">Lip Treatments</option><option id="masks" value="masks">Masks</option><option id="moisturizers" value="moisturizers">Moisturizers</option><option id="selfTannersForFace" value="selfTannersForFace">Self Tanners For Face</option><option id="shaving" value="shaving">Shaving</option><option id="sunCareForFace" value="sunCareForFace">Sun Care For Face</option><option id="treatments" value="treatments">Treatments</option>';
var makeupOptions = '<option id="cheek" value="cheek" selected>Cheek</option><option id="eye" value="eye">Eye</option><option id="face" value="face">Face</option><option id="lip" value="lip">Lip</option>';   
var hairOptions = '<option id="hairStylingAndTreatments" value="hairStylingAndTreatments" selected>Hair Styling and Treatments</option><option id="shampooAndConditioner" value="shampooAndConditioner">Shampoo And Conditioner</option>';
var fragranceOptions = '<option id="forMen" value="forMen" selected>For men</option><option id="forWomen" value="forWomen">For women</option><option id="unisex" value="unisex">Unisex</option>';
var bathAndBodyOptions = '<option id="selfTannersForBody" value="selfTannersForBody" selected>Self Tanners For Body</option><option id="sunCareForBody" value="sunCareForBody">Sun Care For Body</option>';

//Update options in product type according to category
var updateProductTypeList = function(addOrEdit) {
    var selectedOption = $(".category_"+addOrEdit+" option:selected").attr("id");
    var options;
    $(".product_type_"+addOrEdit).html("");
    if (selectedOption === "skincare") {
        options = skincareOptions;
    }
    else if (selectedOption === "makeup") {
        options = makeupOptions;
    }
    else if (selectedOption === "hair") {
        options = hairOptions;
    }
    else if (selectedOption === "fragrance") {
        options = fragranceOptions;
    }
    else {
        options = bathAndBodyOptions;
    }
    $(".product_type_"+addOrEdit).append(options);
};

//Resets values in input fields after adding and editing
var itemInputFieldReset = function(addOrEdit) {
    $(".upc_"+addOrEdit).val("");
    $(".brand_"+addOrEdit).val("");
    $(".name_"+addOrEdit).val("");
    $(".category_"+addOrEdit).find("#skincare").prop("selected", true);
    updateProductTypeList(addOrEdit);
    $(".product_type_"+addOrEdit).find("#cleansers").prop("selected", true);
    $(".shelfLife_"+addOrEdit).val(0);
};

//Attach click listener to edit submit button and update information in DB
var editFunctionReturn = function(id) {
    var editFunction = function(id) {
        //Load current item information in edit form
        $('#'+id).find(".edit.btn").click(function(){
            var userProduct = UserProducts[id];
            $(".upc_edit").val(userProduct.product.upc);
            $(".brand_edit").val(textFormatting(userProduct.product.brand));
            $(".name_edit").val(textFormatting(userProduct.product.name));
            $(".shelfLife_edit").val(userProduct.product.shelfLife);
            $(".category_edit").find("#"+userProduct.product.category).prop("selected", true);
            updateProductTypeList("edit");
            $(".product_type_edit").find("#"+userProduct.product.product_type).prop("selected", true);
            $(".openingDate_edit").val(dateFormatting(userProduct.openingDate));
            $("#editItem").show();
        });

        //Update item information
        $("#editItem").submit(function(event){
            event.preventDefault();
            var upc = $(".upc_edit").val();
            var brand = $(".brand_edit").val().trim().toLowerCase();
            var name = $(".name_edit").val().trim().toLowerCase();
            var category = $(".category_edit option:selected").attr("id");
            var product_type = $(".product_type_edit option:selected").attr("id");
            var openingDate = new Date($(".openingDate_edit").val());
            openingDate.setHours(openingDate.getHours()+(new Date().getTimezoneOffset() / 60));
            var shelfLife = parseInt($(".shelfLife_edit").val());

            //Update Products Object and UserProducts Object
            Products[upc] = new Product(upc, brand, name, category, product_type, shelfLife);
            var expirationDate = new Date(openingDate);
            expirationDate.setMonth(expirationDate.getMonth()+shelfLife);
            UserProducts[upc]= new UserProduct(Products[upc], expirationDate, openingDate);

            //Update database
            firestore.collection("Product").doc(upc).update({
                brand: brand,
                name: name,
                category: firestore.collection("Category").doc(category),
                product_type: firestore.collection("Product Type").doc(product_type),
                shelfLife: shelfLife,
            }).catch(function(error) {
                console.log("Error updating product:", error);
            }).then(function(){
                firestore.collection("User").doc(userID).collection("products").doc(upc).update({
                    openingDate: UserProducts[upc].openingDate,
                    expirationDate: UserProducts[upc].expirationDate
                }).catch(function(error) {
                    console.log("Error updating User products:", error);
                }).then(function() {
                    console.log("update successful");
                    window.location.reload(true);
                });
            }); 
        });
    };
    return editFunction(id);
};

//Remove item from database
var deleteFunctionReturn = function(id) {
    var deleteFunction = function(id) {
        $('#'+id).find(".delete.btn").click(function() {
            var setEmpty = false;
            //if current item is the last one
            if (Object.keys(UserProducts).length == 1) {
                setEmpty = true;
            }
            firestore.collection("User").doc(userID).collection("products").doc(id).delete().then(function() {     
                console.log("Document successfully deleted!");
                if (setEmpty === true) {
                    firestore.collection("User").doc(userID).set({ empty: true });
                }
                delete UserProducts[id];
                window.location.reload(true);
            }).catch(function(error) {
                console.error("Error removing document: ", error);
            });
        });
    };
    return deleteFunction(id);
};

//Number formatting for dates and months: 1 => 01, 7 => 07
var twoDigits = function(num) {
    num = num.toString();
    if (num.length == 1) {
        num = "0"+num;
    }
    return num;
};

//Formatting date in this format(2018-07-09)
var dateFormatting = function(date) {
    var year = date.getFullYear();
    var month = twoDigits(date.getMonth()+1);
    var date = twoDigits(date.getDate());
    return year+"-"+month+"-"+date;
};

 //Function to take out everything after "@" in e-mail.
 function showEmail(string) {
    var indexNumber = string.indexOf("@");
    var newString = string.slice(0, indexNumber);
    return newString;
 };

var userID = "";
var userEmail ="";
var displayName ="";
var Products = {};
var UserProducts = {};

//List registered item
var listRegisteredItem = function(userProduct) {
    $("#itemListBody").append('<tr id='+userProduct.product.upc+'><td scope="row">'+userProduct.product.upc+'</td><td><span class="itemTitleLink">'+textFormatting(userProduct.product.getFullName())+'</span></td><td>'+dateFormatting(userProduct.openingDate)+'</td><td>'+dateFormatting(userProduct.expirationDate)+'</td><td><button class="edit btn" data-toggle="modal" data-target="#editItemModal">Edit</button></td><td><button class="delete btn btn-danger">Delete</button></td></tr>');
    editFunctionReturn(userProduct.product.upc);
    deleteFunctionReturn(userProduct.product.upc);
};

//Get items from User database
var getItemsFromUserDB = function() {
    var snapshot;
    firestore.collection("User").doc(userID).collection("products").get().then(function(querySnapshot) {
        $("#item-num-display").text(querySnapshot.size);
        snapshot = querySnapshot;
        UserProducts = {};
    }).catch(function(error) {
        console.log("Error getting document:", error);
    }).then(function() {
        snapshot.forEach(function(doc) {
            UserProducts[doc.id] = new UserProduct(Products[doc.id], doc.data()["expirationDate"].toDate(), doc.data()["openingDate"].toDate());
            listRegisteredItem(UserProducts[doc.id]);
        });
    });
}

//Add item to User database
var addItemToUserDB = function(userProduct) {
    var upc = userProduct.product.upc;
    //Add item to UserProducts object
    UserProducts[upc] = userProduct;
    //Update User database
    firestore.collection("User").doc(userID).get().then(function(doc){
        if (doc.exists) {
            if (doc.data()["empty"] === true) {
                firestore.collection("User").doc(userID).update({
                    empty: false
                });
            }
            firestore.collection("User").doc(userID).collection("products").doc(upc).set({
                openingDate: userProduct.openingDate,
                expirationDate: userProduct.expirationDate,
                product: firestore.collection("Product").doc(upc),
            }).then(function(){
                console.log("Products add product success");
                window.location.href = "manageItems.html";
            });
        }
        else {
            console.log("cannot find user");
        }
    }).catch(function(error) {
        console.log("Error adding item to User DB:", error);
    });
};

//Get registered items from User database and list registered items.
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        authdata = user;
        userID = firebase.auth().currentUser.uid;
        userEmail = firebase.auth().currentUser.email;
        displayName = showEmail(userEmail);
        $("#email-display").text(displayName);
        
        //Add change listener to category selects in add form and edit form in order to update product types according to category
        $(".category_add").change(function() {
            updateProductTypeList("add");
        });
        $(".category_edit").change(function(){
            updateProductTypeList("edit");
        });

        //Get products in Product database and put them in Products object.
        firestore.collection("Product").get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc) {
                Products[doc.id] = new Product(doc.id, doc.data()["brand"], doc.data()["name"], doc.data()["category"]["id"], doc.data()["product_type"]["id"], doc.data()["shelfLife"]);
            });
        }).catch(function(error) {
            console.log("Error getting products:", error);
        }).then(getItemsFromUserDB());

        //Attach click listener to Add button in manageItems.html and make a list of existing product data for item information auto-completion feature.
        $("#addItemButton").click(function() {
            itemInputFieldReset("add");
            $(".upc_add").change(function(){
                var upc = $(".upc_add").val();
                if (upc in Products) {
                    $(".brand_add").val(Products[upc]["brand"]);
                    $(".name_add").val(Products[upc]["name"]);
                    $(".category_add").find("#"+Products[upc]['category']).prop("selected", true);
                    updateProductTypeList("add");
                    $(".product_type_add").find("#"+Products[upc]['product_type']).prop("selected", true);
                    $(".shelfLife_add").val(Products[upc]["shelfLife"]);
                }
            });
        });

        //Attach submit listener to add item form
        $("#addItem").submit(function(event) {
            event.preventDefault();
            var upc = $(".upc_add").val();
            var brand = $(".brand_add").val().trim().toLowerCase();
            var name = $(".name_add").val().trim().toLowerCase();
            var category = $(".category_add option:selected").attr("id");
            var product_type = $(".product_type_add option:selected").attr("id");
            var openingDate = new Date($(".openingDate_add").val());
            openingDate.setHours(openingDate.getHours()+(new Date().getTimezoneOffset() / 60));
            var shelfLife = parseInt($(".shelfLife_add").val());

            //search existing db with upc and add item to User DB
            if (!(upc in Products)) {
                Products[upc] = new Product(upc, brand, name, category, product_type, shelfLife);
                var expirationDate = new Date(openingDate);
                expirationDate.setMonth(expirationDate.getMonth()+shelfLife);
                userProduct = new UserProduct(Products[upc], expirationDate, openingDate);
                firestore.collection("Product").doc(upc).set({
                    brand: brand, 
                    name: name,
                    category: firestore.collection("Category").doc(category),
                    product_type: firestore.collection("Product Type").doc(product_type),
                    shelfLife: shelfLife,
                }).catch(function(error) {
                    console.error("Error writing document: ", error);
                }).then(function() {
                    console.log("Product successfully written!");
                    addItemToUserDB(userProduct);
                });
            }
            else {
                var expirationDate = new Date(openingDate);
                expirationDate.setMonth(expirationDate.getMonth()+shelfLife);
                userProduct = new UserProduct(Products[upc], expirationDate, openingDate);
                addItemToUserDB(userProduct);
            }
        });
    }
    else {
        authdata = null;
    }
});

//Sign Out Function
var signOut = function () {
    firebase.auth().signOut().then(function () {
      alert("You have signed out successfully!");
    }).catch(function (err) {
      alert("Unable to sign out!");
    });
};
  
//Back to homepage button
$(document).ready(function() {
    $("#backToHomePage").click(function() {
        window.location.href = './index.html';
    });
    $("#signOutButton").click(function () {
        signOut();
        window.location.href = './index.html';
    });
});

