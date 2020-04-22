/**
 * Copyright (c) 2019, Massachusetts Institute of Technology (MIT)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Utility for initializing connection to MongoDB
 */
const util = require('util');
const MongoClient = require('mongodb').MongoClient;

const dbHost = "localhost";
const dbPort = 27017;
const dbUser = "mongouser";
const dbPass = "mongopass";
const dbName = "dcchess";


let _db;
let mongoUri = util.format("mongodb://%s:%s@%s:%d/%s", dbUser, dbPass, dbHost, dbPort, dbName);

module.exports = {

  init: function( callback ) {
    console.log("Initializing Mongo connection... please wait...");
    const hrstart = process.hrtime();
    MongoClient.connect( mongoUri, {useNewUrlParser: true}, function( err, db ) {
      _db = db;
      const hrend = process.hrtime(hrstart);
      console.log(util.format("\tInit took %ds %dms", hrend[0], hrend[1] / 1000000));
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};