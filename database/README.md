# Database Connectivity
See license information below.

DISTRIBUTION STATEMENT A. Approved for public release. Distribution is unlimited.
This material is based upon work supported by the Defense Advanced Research Projects Agency under Air Force Contract No. FA8702-15-D-0001. Any opinions, findings, conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the Defense Advanced Research Projects Agency.

© 2019 Massachusetts Institute of Technology.
MIT Proprietary, Subject to FAR52.227-11 Patent Rights - Ownership by the contractor (May 2014) 

Delivered to the U.S. Government with Unlimited Rights, as defined in DFARS Part 252.227-7013 or 7014 (Feb 2014). Notwithstanding any copyright notice, U.S. Government rights in this work are defined by DFARS 252.227-7013 or DFARS 252.227-7014 as detailed above. Use of this work other than as specifically authorized by the U.S. Government may violate any copyrights that exist in this work.

# NOTES
Currently using MongoDB as the back-end datastore.

This installation is meant for local use only. This is NOT a secure installation or configuration.

# Install

## Ubuntu
`sudo apt install mongodb`

## Windows
[Windows Installer](https://docs.mongodb.com/v3.2/tutorial/install-mongodb-on-windows/)

## Node
May need to rebuild application after installation of mongo.

`npm rebuild` or `npm install` (not sure which is correct)

NOTE: you may need to upgrade nodejs to 7.4 or higher.

## Create a Database and User
The user is currently hardcoded in the /database/mongo.js file. See the _user_ and _pass_ variables. In future this will be extracted to a configuration file.

To create a user, you need to access your Mongo installation's shell. In Ubuntu/Linux, simply run `mongo` in a terminal.

1. Execute `use dcchess;` to switch to the dcchess database. If it doesn't exist, it is created for you.
2. Add a user
  1. Execute the following to create the user: `db.createUser({user:"mongouser", pwd:"mongopass", roles: [{role: "readWrite", db: "dcchess"}]});`
  2. This should create the user 'mongouser' with read/write permission on the dcchess database. Execute `show users;` to see that your new user has been added."

# Configuration
Currently using MongoDB as is, so it's only allowing localhost connections. As mentioned above for user configuration, the connection information is currently hardcoded in /database/mongo.js as well.

# Licenses ([BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause))
Copyright (c) 2019, Massachusetts Institute of Technology (MIT) All rights reserved. Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.