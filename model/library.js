const { Schema } = require ( 'mongoose')
const { model} = require ('mongoose')
const demo = new Schema ({
    bookid: { type: String, required: true},
    borrower: { type: String, required: true},
    book: { type: String, required: true},
    due: {type: String, required: true},
    status: {type: String, required: true, default:"available"}
});

const sample = model('library', demo);
module.exports = sample;