import express from "express";
import cors from "cors";
import Sequelize from "sequelize";
import DataTypes from "sequelize";
import { Snowflake } from "@theinternetfolks/snowflake";
import { get } from "http";

const port = 3000 || process.env.PORT;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const sequelize = new Sequelize(
  "postgres://postgres:postgrespw@localhost:55000/nama"
);
const User = sequelize.define("User", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Community = sequelize.define("Community", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      foriegnKey: true,
      model: User,
      key: "id",
    },
  },
});

const role = sequelize.define("role", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const member = sequelize.define("member", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      foriegnKey: true,
      model: User,
      key: "id",
    },
  },
  community: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      foriegnKey: true,
      model: Community,
      key: "id",
    },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      foriegnKey: true,
      model: role,
      key: "id",
    },
  },
});

function getsuccessStruct(data) {
  return {
    status: true,
    content: {
      data,
    },
  };
}

function getErrorStruct(errors) {
  return {
    status: false,
    errors,
  };
}

app.post("/v1/role", (req, res) => {
  const { name } = req.body;
  if (name === undefined || name.length < 2) {
    res.json(
      getErrorStruct({
        param: name,
        message: "Namemust be at least 2 characters long",
        code: "INVALID_INPUT",
      })
    );
  } else {
    role.create({ id: Snowflake.generate(), name }).then((role) => {
      res.json(getsuccessStruct(role));
    });
  }
});

app.get("/v1/role", (req, res) => {
  role.findAndCountAll({ limit: 10, offset: page * 10 }).then((roles) => {
    res.json(
      getsuccessStruct({
        meta: {
          page: 1,
          total: 10,
          limit: 10,
        },
      })
    );
  });
});

app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  console.log(`API Listening on port ${port}`);
});
