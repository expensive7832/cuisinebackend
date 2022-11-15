import express from "express";
import Db from "./../Db.js";
import formidable from "formidable";
import jwt from "jsonwebtoken"
import cloudinary from "cloudinary"
import dotenv from "dotenv"
import mailer from "nodemailer"

dotenv.config()

const transporter = mailer.createTransport({
  service:"gmail",
  auth:{
    user:"expensive7832@gmail.com",
    pass:"zoizixgqjjdvhvgj",
  }
})

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
})




router.post("/category/:id", (req, res) => {
  const form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    const { title } = fields
    const { photo } = files
    const { id } = req.params

    const sql = "SELECT * FROM users WHERE id = $1"

    Db.query(sql, [id], (err, result) => {
      if (err) {
        console.log(err)
      } else {
        jwt?.verify(result?.rows[0]?.token, process?.env?.TOKEN, (err, info) => {
          if (err) {
            return res.status(203).json({ message: "authorisation needed" })
          } else {
            if (result?.rows[0]?.id === info?.id) {

              if (photo.originalFilename !== "") {
                cloudinary.v2.uploader.upload(photo?.filepath, { folder: "fooddelivery/category" }, (err, result) => { // content is the name of the image input on the front end form
                  if (err) {
                    console.log(err)
                  } else {
                    const imgUrl = result.secure_url;
                    const imgId = result.public_id
                    const sql = "INSERT INTO categories(title, img, imgId) VALUES ($1,$2,$3)"
                    Db.query(sql, [title, imgUrl, imgId], (err, result) => {
                      if (err) {
                        return res.status(203).json({ message: "error" })
                      } else {
                        return res.status(200).json({ message: "category created" })
                      }
                    })

                  }

                });
              } else {
                const sql = "INSERT INTO categories(title) VALUES ($1)"
                Db.query(sql, [title], (err, result) => {
                  if (err) {
                    return res.status(203).json({ message: "error" })
                  } else {
                    return res.status(200).json({ message: "category created" })
                  }
                })
              }


            }
          }
        })

      }
    })

  })
})

router.post("/deleteCat/:id", (req, res) => {


  const { id } = req.params

  const sql = "SELECT * FROM users WHERE id = $1"

  Db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err)
    } else {
      jwt.verify(result?.rows[0]?.token, process.env.TOKEN, (err, info) => {
        if (err) {
          return res.status(203).json({ message: "authorisation needed" })
        } else {
          if (result?.rows[0]?.id === info?.id) {

            if (req.body.imgid !== null) {
              cloudinary.v2.uploader.destroy(req.body.imgid, (err, result) => { // content is the name of the image input on the front end form
                if (err) {
                  console.log(err)
                }
              });
            }

            const sql = "DELETE FROM categories WHERE id = $1"
            Db.query(sql, [req.body.id], (err, result) => {
              if (err) {
                return res.status(203).json({ message: "error" })
              } else {
                return res.status(200).json({ message: "Category Deleted" })
              }
            })
          }
        }
      })

    }
  })

})

router.get('/getCat', (req, res) => {
  const sql = 'SELECT * FROM categories';

  Db.query(sql, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.json({ cat: result })
    }
  })
})

router.get('/getFoodHome', (req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY id DESC LIMIT 8 ';

  Db.query(sql, async(err, result) => {
    if (err) {
      console.log(err)
    } else {
      const data = []
     for(const info of result.rows){
      data.push({...info, imgs: JSON.parse(info.imgs[0])})
     }
      
     res.json({ food: data })
    }
  })
})

router.get('/foodLowPrice', (req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY price ASC';

  Db.query(sql, async(err, result) => {
    if (err) {
      console.log(err)
    } else {
      const data = []
     for(const info of result.rows){
      data.push({...info, imgs: JSON.parse(info.imgs[0])})
     }
      
     res.json({ food: data })
    }
  })
})

router.get('/foodHighPrice', (req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY price DESC';

  Db.query(sql, async(err, result) => {
    if (err) {
      console.log(err)
    } else {
      const data = []
     for(const info of result.rows){
      data.push({...info, imgs: JSON.parse(info.imgs[0])})
     }
      
     res.json({ food: data })
    }
  })
})

router.get('/getFood', (req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY id DESC';

  Db.query(sql, async(err, result) => {
    if (err) {
      console.log(err)
    } else {
      const data = []
     for(const info of result.rows){
      data.push({...info, imgs: JSON.parse(info.imgs[0])})
     }
      
     res.json({ food: data })
    }
  })
})

router.post('/getFoodSearch', (req, res) => {

  const { search} = req.body
  const sql = `SELECT id, title, description, cat, price, imgs FROM product WHERE title LIKE '%${search}%' OR description LIKE '%${search}%'  `;

  Db.query(sql, (err, result) =>{
    if(err){
      console.log(err)
    }else{
      const data = []
     for(const info of result.rows){
      data.push({...info, imgs: JSON.parse(info.imgs[0])})
     }
      
     res.json({ food: data })
    }
  })
})



router.post('/getFoodDetails/:id', (req, res) => {
  const {id} = req.params
  const sql = 'SELECT * FROM product WHERE id = $1';
  Db.query(sql,[id], async(err, result) => {
    if (err) {
      console.log(err)
    } else {
      
     res.json({ food: result.rows })
    }
  })
})


router.post('/food/:id', (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true })
  form.parse(req, (err, fields, files) => {
    const { description, title, price, cat } = fields
    const { photos } = files
    const { id } = req.params
    const newPrice = `${price}.00`



    const sql = "select token, id from users where id = $1"
    Db.query(sql, [id], async (err, result) => {
      if (err) {
        console.log(err)
      } else {
        jwt.verify(result?.rows[0]?.token, process.env.TOKEN, async (err, info) => {
          if (err) {
            console.log(err)
          } else {
            if (result?.rows[0]?.id === info?.id) {
              if (photos?.length > 0) {
                const data = []
                for (const photo of photos) {

                  await cloudinary.v2.uploader.upload(photo.filepath, { folder: "fooddelivery/food" })
                    .then(function (res) {

                      data.push({ imgUrls: res.secure_url, imgIds: res.public_id })
                    })
                    .catch((err) => console.log(err))

                }
                const catD = Array?.isArray(cat) ? cat : [cat]
                const sql = "INSERT INTO product(title, description, price, cat, imgs) VALUES ($1,$2,$3,$4,$5)"
                Db.query(sql, [title, description, newPrice, catD, data], (err, result) => {
                  if (err) {
                    res.status(203).json({ message: "error", err: err })
                  } else {
                    res.status(200).json({ message: "food created" })
                  }
                })


              } else {

                cloudinary.v2.uploader.upload(photos?.filepath, { folder: "fooddelivery/food" }, (err, result) => { // content is the name of the image input on the front end form
                  if (err) {
                    console.log(err)
                  } else {
                    const imgUrls = result.secure_url;
                    const imgIds = result.public_id

                    const catD = Array.isArray(cat) ? cat : [cat]
                    const imgD = [{ imgUrls, imgIds }]
                    const sql = "INSERT INTO public.product(title, description, price, cat, imgs) VALUES ($1,$2,$3,$4,$5)"

                    Db.query(sql, [title, description, newPrice, catD, imgD], (err, result) => {
                      if (err) {
                        res.status(203).json({ message: "error", err: err })
                      } else {
                        res.status(200).json({ message: "food created" })
                      }
                    })

                  }

                })
              }

            }
          }
        })
      }
    })

  })
})


router.post("/review", (req, res) =>{
  const {name, review, email} = req.body

  const sql = "INSERT INTO productreview (name, email, review) VALUES($1,$2,$3) RETURNING *";
  Db.query(sql, [name, email, review], (err, result) =>{
    if(err){
      console.log(err)
    }else{
      res.status(200).json({msg:"review submitted"})
    }
  })
})

router.get("/review", (req, res) =>{


  const sql = "SELECT * FROM productreview";
  Db.query(sql, (err, result) =>{
    if(err){
      console.log(err)
    }else{
      res.status(200).json({review: result.rows})
    }
  })
})



router.post("/contact", (req, res) =>{
 const {name, msg, subject, email} = req.body

 if(name === "" || email === "" || subject === "" || msg === ""){
  res.json({message:"Input field cannot be empty"})
}else{
  transporter.sendMail({
    from: email,
    to: "expensive7832@gmail.com",
    subject: subject,
    text: msg
  }, (err, result) =>{
    if(err){
      console.log(err)
    }else{
      res.status(200).json({message: "email sent successfully"})
    }
  })

}



})



router.post("/order", (req, res) =>{
 const {name, street, phone, country, city, email, amount, ref} = req.body

 if(req.body.name === undefined || req.body.street === undefined || req.body.phone === undefined || req.body.country === undefined || req.body.city === undefined || req.body.email === undefined || req.body.amount === undefined || req.body.ref === undefined){
  res.json({message: 'empty field'})
 }else{

  const sql = "INSERT INTO public.order(name, street, phone, country, city, email, amount, ref) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *"
  Db.query(sql, [name, street, phone, country, city, email, amount, ref], (err, result) =>{
    if(err){
      console.log(err)
    }else{
      res.json({message: "order save"})
    }
  })
}
})

export default router;

