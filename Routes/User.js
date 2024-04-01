import express from "express";
import Db from "./../Db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const namePattern = /^[a-z]{3,}$/i
const emailPattern = /^[\w]{2,}@[a-z]{3,}\.[a-z]{2,}$/i


const router = express.Router();

router.post("/register", async (req, res) => {

  

  const { fname, lname, email, pwd } = req.body;

  if (fname === "" || lname === "" || email === "" || pwd === "") {
    return res.status(203).json({ message: "Input Field Cannot Be Empty" });

  } else if(!namePattern.test(fname) || !namePattern.test(lname)) {
    
   return res.status(203).json({ message: "Enter Valid Name" });

  } else if (!emailPattern.test(email)) {
    return res.status(203).json({ message: "Enter Valid Email" });

  }else {
    const sql = "SELECT * FROM users WHERE email = $1";
    Db.query(sql, [email], async(err, result) => {
      if (result.rows.length === 0) {
        const sql = "INSERT INTO users(fname, lname, email, pwd, token) VALUES($1,$2,$3,$4,$5) RETURNING *";
        const PWD_HASH = await bcrypt.genSalt(10)
       
        bcrypt.hash(pwd, PWD_HASH, async(err, hash) => {
          if (err) {
            console.log(err);
          } else {
            
            const signed = jwt.sign({ email }, process.env.TOKEN, { expiresIn: "24h" })
            await Db.query(sql, [fname, lname, email, hash, signed], (err, result) => {
              if (err) {
                console.log({ message: err.stack });
              } else {

                return res.status(200).json({ message: "Account Successfully Created", token: signed });
              }
            });
          }
        });
      } else {
        res.status(203).json({ message: "Email Already Exists" });
      }
    });
  }





});


router.post("/login", async (req, res) => {
  const { email, pwd } = req.body;

  if (email === "" || pwd === "") {

    res.status(203).json({ message: "input field cannot be empty" });

  } else {
    const sql = "SELECT * FROM users WHERE email = $1";

    await Db.query(sql, [email], async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        if (result.rows.length > 0 ) {
          bcrypt?.compare(pwd, result?.rows[0]?.pwd, (err, realPwd) => {
            if (err) {
              // res.status(203).json({ message: "Invalid credentials" });
              console.log(err.message);
            } else {
              if (realPwd === true) {
                const token = jwt.sign({ id: result?.rows[0]?.id }, process.env.TOKEN, { expiresIn: "24h" })
                const sql = "UPDATE users SET token = $1 WHERE id = $2 RETURNING *"

                Db.query(sql, [token, result?.rows[0]?.id], (err, result) => {
                  if (err) {
                    console.log(err)
                  }else{
                    res.status(200).json({ message: "login Successful", user: result?.rows[0] });
                  }
                })

               
              } else {
                res.status(203).json({ message: "Incorrect Password" });
              }
            }
          });
        } else {
          res.status(203).json({ message: "Email Not Found" });
        }
      }
    });
  }

});


router.patch("/update/:id", async(req, res) => {
  const { fname, lname } = req.body
  const { id } = req.params

 
  const sql = "select token, id from users where id = $1"
  await Db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err)
    } else {
     

      jwt.verify(result.rows[0]?.token, process.env.TOKEN, async(err, info) => {
        if (err) {
          console.log(err)
        } else {
          if (result.rows[0]?.id === info?.id) {
            const sql = "UPDATE users SET fname = $1, lname = $2 WHERE id = $3 RETURNING *";

            await Db.query(sql, [fname, lname, info?.id], (err, result) => {
              if (err) {
                console.log(err)
              } else {
                res.status(200).json({ message: "update Successful", user: { fname, lname,  } })
              }
            })
          }
        }
      })
    }
  })


})

router.delete('/delete/:id', (req, res) => {
  const { id } = req.params
 
 
  const sql = "select token, id from users where id = $1"
  Db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err)

    } else {
      jwt?.verify(result.rows[0]?.token, process.env.TOKEN, (err, info) => {
        if (err) {
          console.log(err)
        } else {
          if (info.id === result.rows[0]?.id) {
            const sql = 'DELETE FROM users WHERE id = $1'
            Db.query(sql, [info?.id], (err, result) => {
              if (err) {
                console.log(err)
              } else {
                res.status(200).json({ message: 'delete successful' })
              }
            })
          }
        }
      })
    }
  })

})



export default router;
