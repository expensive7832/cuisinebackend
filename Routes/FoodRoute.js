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
  form.parse(req, async(err, fields, files) => {
    const { title } = fields
    const { photo } = files
    const { id } = req.params

    
    const sql = "SELECT * FROM users WHERE id = $1"

   try{
    await Db.query(sql, [id], (err, result) => {
      if (err) {
        console.log(err)
      } else {
        jwt?.verify(result?.rows[0]?.token, process?.env?.TOKEN, async(err, info) => {
          if (err) {
            return res.status(203).json({ message: "authorisation needed" })
          } else {
            let checkTitleSql = `SELECT * FROM categories WHERE title = $1 `;

            await Db.query(checkTitleSql, [title], async(err, titlecheck) =>{
              if(titlecheck?.rows?.length > 0){
                return res.status(203).json({message: "title already exists"});

              }else{

                if (result?.rows[0]?.id === info?.id) {
                 
                  if (photo.originalFilename !== "") {
                    await cloudinary.v2.uploader.upload(photo?.filepath, { folder: "fooddelivery/category" }, async(err, result) => { // content is the name of the image input on the front end form
                      if (err) {
                        console.log(err)
                      } else {
                        const imgUrl = result.secure_url;
                        const imgId = result.public_id
                        const sql = "INSERT INTO categories(title, img, imgId) VALUES ($1,$2,$3)"
                        await Db.query(sql, [title, imgUrl, imgId], (err, result) => {
                          if (err) {
                            return res.status(203).json({ message: err.stack })
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
      }
    })
   }catch(e){
    console.log(e);
    res.status(500).json({message: e})
   }

  })
})

router.delete("/deleteCat", async(req, res) => {

  const { userid, itemid, imgid } = req.query



  const sql = "SELECT * FROM users WHERE id = $1"

  await Db.query(sql, [userid], (err, result) => {
    if (err) {
      console.log(err)
    } else {
      jwt.verify(result?.rows[0]?.token, process.env.TOKEN, async(err, info) => {
        if (err) {
          return res.status(400).json({ message: "authorisation needed" })
        } else {
          if (result?.rows[0]?.id === info?.id && result?.rows[0]?.role === true) {
          
            if (imgid !== null) {
              await cloudinary.v2.uploader.destroy(imgid, (err, result) => { // content is the name of the image input on the front end form
                if (err) {
                  console.log(err)
                }
              });
            }

            const sql = "DELETE FROM categories WHERE id = $1"
            await Db.query(sql, [itemid], (err, result) => {
              if (err) {
                return res.status(400).json({ message: err.message })
              } else {
                return res.status(200).json({ message: "Category Deleted" })
              }
            })
          }else{

            return res.status(400).json({ message: "authorisation needed" })
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
      res.status(200).json({ cat: result })
    }
  })
})


router.get('/getFoodHome', async(req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY id DESC LIMIT 8 ';

  await Db.query(sql, async(err, {rows}) => {
    if (err) {
      console.log(err)
    } else {
    //   const data = []
    //  for(const info of result?.rows){
    //   data.push({...info, imgs: JSON.parse(info.imgs[0])})
    //  }
      
     res.status(200).json({ food: rows })
    }
  })
})

router.get('/foodLowPrice', async(req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY price ASC';

  await Db.query(sql, async(err, {rows}) => {
    if (err) {
      console.log(err)
    } else {
     
     res.status(200).json({ food: rows })
    }
  })
})

router.get('/foodHighPrice', (req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY price DESC';

  Db.query(sql, async(err, {rows}) => {
    if (err) {
      console.log(err)
    } else {
      res.status(200).json({ food: rows })
    }
  })
})

router.get('/getFood', async(req, res) => {
  const sql = 'SELECT id, title, description, cat, price, imgs FROM product ORDER BY id DESC';

  await Db.query(sql, async(err,{rows}) => {
    if (err) {
      console.log(err)
    } else {
     
     res.status(200).json({ food: rows })
    }
  })
})

router.get('/getFoodSearch', async(req, res) => {

  const { search } = req.query
  const sql = `SELECT id, title, description, cat, price, imgs FROM product WHERE title LIKE '%${search}%' OR description LIKE '%${search}%'  `;

  await Db.query(sql, (err, {rows}) =>{
    if(err){
      console.log(err)
    }else{
    //   const data = []
    //  for(const info of result.rows){
    //   data.push({...info, imgs: JSON.parse(info.imgs[0])})
    //  }
      
     res.status(200).json({ food: rows })
    }
  })
})



router.get('/getFoodDetails/:id', (req, res) => {
  const {id} = req.params
  const sql = 'SELECT * FROM product WHERE id = $1';
  Db.query(sql,[id], async(err, {rows}) => {
    if (err) {
      console.log(err)
    } else {
      let data = []
      for( let each of rows[0]?.imgs){
        let obj = {
          url: JSON.parse(each)?.url,
          id: JSON.parse(each)?.id,
        }

        data.push(obj)
      }
     res.json({ food: {...rows[0], imgs: data}})
    }
  })
})


router.post('/food/:id', (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true, allowEmptyFiles: false })

    form.parse(req, (err, fields, files) => {
      if(err){
        return res.status(400).json({message: err.message})
      }else{

        
      const { description, title, price, cat } = fields
      const { photos } = files
      const { id } = req.params
  
      if(description === ""  || title === "" || price === "" || cat == undefined){
       return res.status(400).json({message: "all fields are required"})
        
      }else{
  
        const sql = "select token, id from users where id = $1"
        Db.query(sql, [id], async (err, result) => {
          if (err) {
            console.log(err)
          } else {
            jwt.verify(result?.rows[0]?.token, process.env.TOKEN, async(err, info) => {
              if (err) {
                console.log(err)
              } else {
                if (result?.rows[0]?.id === info?.id) {
                 let checkTitleSql = "select * from product where title = $1";
    
                 await Db.query(checkTitleSql, [title], async(err, {rows}) =>{
                  if(err){
                    console.log(err.message)
    
                  }else if(rows.length > 0){
                   return res.status(400).json({message: "title already exists"})
    
                  }else{
    
                    if (photos?.length > 0) {
                      const data = []
                      for (const photo of photos) {
      
                        await cloudinary.v2.uploader.upload(photo.filepath, { folder: "fooddelivery/food" })
                          .then(function (res) {
      
                            data.push({ url: res.secure_url, id: res.public_id })
                          })
                          .catch((err) => {
                            return res.status(400).json({message: err.message})
                          })
      
                      }
      
                      const sql = "INSERT INTO product(title, description, price, cat, imgs) VALUES ($1,$2,$3,$4,$5)"
                      await Db.query(sql, [title, description, price, cat, data], (err, result) => {
                        if (err) {
                          res.status(400).json({ message: err.message })
                        } else {
                          res.status(200).json({ message: "food created" })
                        }
                      })
      
      
                    } else {
      
                     await cloudinary.v2.uploader.upload(photos?.filepath, { folder: "fooddelivery/food" }, (err, result) => { // content is the name of the image input on the front end form
                        if (err) {
                          console.log(err)
                        } else {
                          const imgUrls = result.secure_url;
                          const imgIds = result.public_id
      
                          const imgD = [{ imgUrls, imgIds }]
                          const sql = "INSERT INTO product(title, description, price, cat, imgs) VALUES ($1,$2,$3,$4,$5)"
      
                          Db.query(sql, [title, description, price, cat, imgD], (err, result) => {
                            if (err) {
                              res.status(203).json({ message: err.message })
                            } else {
                              res.status(200).json({ message: "food created" })
                            }
                          })
      
                        }
      
                      })
                    }
    
                  }
                  
                 })
    
    
                }else{
                  return res.status(400).json({ message: "unauthorized"})
                }
              }
            })
          }
        })
  
      }

      }
      
    })

  
})


router.post("/review", async(req, res) =>{
  const {name, review, email, foodId} = req.body

  const sql = "INSERT INTO productreview (name, email, review, foodid) VALUES($1,$2,$3,$4) RETURNING *";
  await Db.query(sql, [name, email, review,foodId], (err, result) =>{
    if(err){
      console.log(err)
    }else{
      res.status(200).json({msg:"review submitted"})
    }
  })
})

router.get("/review/:id", async(req, res) =>{

  let id = req.params.id

  const sql = "SELECT * FROM productreview where foodid = $1";
  await Db.query(sql,[id], (err, {rows}) =>{
    if(err){
      console.log(err)
    }else{

      res.status(200).json({review: rows})
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



router.post("/order", async(req, res) =>{
 const {name, street, phone, country, city, email, amount, ref} = req.body

 if(req.body.name === undefined || req.body.street === undefined || req.body.phone === undefined || req.body.country === undefined || req.body.city === undefined || req.body.email === undefined || req.body.amount === undefined || req.body.ref === undefined){
  res.json({message: 'empty field'})
 }else{

  const sql = "INSERT INTO orderData(name, street, phone, country, city, email, amount, ref) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *"
  await Db.query(sql, [name, street, phone, country, city, email, amount, ref], (err, result) =>{
    if(err){
      console.log(err.stack);
      res.status(400).json({message: err.message});
    }else{
      res.status(200).json({message: "order save"})
    }
  })
}
})

export default router;

