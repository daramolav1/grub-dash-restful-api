const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
}

function dataHasProp(prop) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[prop]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${prop}`,
    });
  };
}

function isValidDelivery(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a deliverTo`,
  });
}

function isValidMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a mobileNumber`,
  });
}

const statusArray = ["delivered", "pending", "out-for-delivery", "preparing"];

function isValidStatus(req, res, next) {
  const { data: { status } = {} } = req.body;

  if (status === "delivered") {
    return next({
      status: 404,
      message: `A delivered order cannot be changed`,
    });
  }

  if (status && statusArray.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function isValidDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function dishesQuantityExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !dish.quantity);
  index != -1
    ? next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    : next();
}

function dishesQuantityGreaterThanZero(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => dish.quantity <= 0);
  index != -1
    ? next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    : next();
}

function dishesQuantityIsAnInteger(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !Number.isInteger(dish.quantity));
  index != -1
    ? next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    : next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
}

function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
}

function doesOrderIdMatch(req, res, next) {
  const order = res.locals.order;
  if (!req.body.data.id || order.id === req.body.data.id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id ${req.body.data.id} does not match`,
  });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function isStatusPending(req, res, next) {
  const order = res.locals.order;

  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  next();
}

function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.order.id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    dataHasProp("deliverTo"),
    dataHasProp("mobileNumber"),
    dataHasProp("dishes"),
    isValidDelivery,
    isValidMobileNumber,
    isValidDishes,
    dishesQuantityExists,
    dishesQuantityGreaterThanZero,
    dishesQuantityIsAnInteger,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    dataHasProp("deliverTo"),
    dataHasProp("mobileNumber"),
    dataHasProp("dishes"),
    isValidDelivery,
    isValidMobileNumber,
    isValidStatus,
    isValidDishes,
    dishesQuantityExists,
    dishesQuantityGreaterThanZero,
    dishesQuantityIsAnInteger,
    doesOrderIdMatch,
    update,
  ],
  delete: [orderExists, isStatusPending, destroy],
};
