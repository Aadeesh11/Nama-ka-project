import express from "express";
import cors from "cors";
import Sequelize from "sequelize";
import DataTypes from "sequelize";
import { Snowflake } from "@theinternetfolks/snowflake";

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

const Role = sequelize.define("role", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Member = sequelize.define("member", {
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
      model: Role,
      key: "id",
    },
  },
});

function getsuccessStruct(data) {
  return {
    status: true,
    content: data,
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
    Role.create({ id: Snowflake.generate(), name }).then((role) => {
      res.json(getsuccessStruct({ data: role }));
    });
  }
});

app.get("/v1/role", (req, res) => {
  let { page } = req.query;
  if (page === undefined || page < 0) {
    page = 0;
  }
  Role.findAndCountAll({ limit: 10, offset: page * 10, where: {} }).then(
    (roles) => {
      res.json(
        getsuccessStruct({
          meta: {
            page: page + 1,
            total: roles.count,
            pages: parseInt(roles.count / 10) + 1,
          },
          data: roles.rows,
        })
      );
    }
  );
});

app.post("/v1/community", (req, res) => {
  const { name } = req.body;
  if (name === undefined || name.length <= 2) {
    res.json(
      getErrorStruct({
        param: name,
        message: "Name must be at least 2 characters long",
        code: "INVALID_INPUT",
      })
    );
  } else {
    const user_id = req.decoded.id;
    Community.create({
      id: Snowflake.generate(),
      name,
      slug: name.toLowerCase(),
      owner: user_id,
    }).then((community) => {
      Member.create({
        id: Snowflake.generate(),
        user: user_id,
        community: community.id,
        role: Role.findOne({ where: { name: "Community Admin" } }).id,
      });
      res.json(getsuccessStruct({ data: community }));
    });
  }
});

app.get("/v1/community", (req, res) => {
  let { page } = req.query;
  if (page === undefined || page < 0) {
    page = 0;
  }
  Community.findAndCountAll({
    limit: 10,
    offset: page * 10,
    where: { owner: req.decoded.id },
    include: [
      {
        model: User,
        required: true,
        attributes: ["id", "name"],
        as: "owner",
      },
    ],
  }).then((communities) => {
    res.json(
      getsuccessStruct({
        meta: {
          page: page + 1,
          total: communities.count,
          pages: parseInt(communities.count / 10) + 1,
        },
        data: communities.rows,
      })
    );
  });
});

app.get("/v1/community/:id/members", (req, res) => {
  let { page } = req.query;
  if (page === undefined || page < 0) {
    page = 0;
  }
  Member.findAndCountAll({
    limit: 10,
    offset: page * 10,
    where: { community: req.params.id },
    include: [
      {
        model: User,
        required: true,
        attributes: ["id", "name"],
        as: "user",
      },
      {
        model: Role,
        required: true,
        attributes: ["id", "name"],
        as: "role",
      },
    ],
  }).then((members) => {
    res.json(
      getsuccessStruct({
        meta: {
          page: page + 1,
          total: members.count,
          pages: parseInt(members.count / 10) + 1,
        },
        data: members.rows,
      })
    );
  });
});

app.get("/v1/community/me/owner", (req, res) => {
  let { page } = req.query;
  if (page === undefined || page < 0) {
    page = 0;
  }
  Community.findAndCountAll({
    where: { owner: req.decoded.id },
  }).then((communities) => {
    res.json(
      getsuccessStruct({
        meta: {
          page: page + 1,
          total: communities.count,
          pages: parseInt(communities.count / 10) + 1,
        },
        data: communities.rows,
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
