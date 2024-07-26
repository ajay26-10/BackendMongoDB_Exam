const { Schema } = require ( 'mongoose')
const { model} = require ('mongoose')
const demo = new Schema ({
    
    book: { type: String, required: true},
    donatedby: {type: String, required: true}
});

const sample = model('userlibrary', demo);
module.exports = sample;