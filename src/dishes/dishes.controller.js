const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function dataHasProp(prop) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[prop]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${prop}`,
    });
  };
}

function isValidName(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a name`,
  });
}

function isValidDescription(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a description`,
  });
}

function isValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price > 0 && Number.isInteger(price)) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

function isValidImage(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a image_url`,
  });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${req.params.dishId}`,
  });
}

function read(req, res) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    dataHasProp("name"),
    dataHasProp("description"),
    dataHasProp("price"),
    dataHasProp("image_url"),
    isValidName,
    isValidDescription,
    isValidPrice,
    isValidImage,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    dataHasProp("name"),
    dataHasProp("description"),
    dataHasProp("price"),
    dataHasProp("image_url"),
    isValidName,
    isValidDescription,
    isValidPrice,
    isValidImage,
    update,
  ],
};
