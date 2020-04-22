# Clausewitzian (Dead Carl) Chess
See license information below.

DISTRIBUTION STATEMENT A. Approved for public release. Distribution is unlimited.
This material is based upon work supported by the Defense Advanced Research Projects Agency under Air Force Contract No. FA8702-15-D-0001. Any opinions, findings, conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the Defense Advanced Research Projects Agency.

© 2019 Massachusetts Institute of Technology.
MIT Proprietary, Subject to FAR52.227-11 Patent Rights - Ownership by the contractor (May 2014) 

Delivered to the U.S. Government with Unlimited Rights, as defined in DFARS Part 252.227-7013 or 7014 (Feb 2014). Notwithstanding any copyright notice, U.S. Government rights in this work are defined by DFARS 252.227-7013 or DFARS 252.227-7014 as detailed above. Use of this work other than as specifically authorized by the U.S. Government may violate any copyrights that exist in this work.

# Background
## Purpose
This tool is a chess variant designed to demonstrate the possibility of modeling complex cognitive concepts in simple, well-known games. More specifically, the effort that led to the tool’s creation focused on understanding the complications that arise in complex systems of systems. It is important to note that in its current form the tool is an engineering prototype. The focus was on modeling concepts and not about game polish or production level development. We leave further polishing to future efforts and/or to the open source community.

We vary the standard rules and play of chess to directly model fog of war, friction, force composition, and asymmetric ends (limited versus total warfare). In this context, we define fog of war as hidden or uncertain information about one’s self or one’s adversary. Likewise, we define friction as the inability to receive or execute an order as desired. Chance heavily influences both of these notions. In addition, we let players select their starting pieces and layout to achieve composition. Finally, we have altered the notion of victory in the game of chess so that our variant is no longer a zero-sum game (both sides can now simultaneously win or lose). We include in the repo a [companion guide PDF](Clausewitzian_Chess_v6.pdf) that details these concepts.

The [companion guide PDF](Clausewitzian_Chess_v6.pdf) describes all major game elements and includes a discussion of how each element manifests in the game and why it was included in the design. In addition, the guide contains instructions on how to run the software tool and how to play the game. Finally, the [companion guide PDF](Clausewitzian_Chess_v6.pdf) discusses our findings from internal playtesting, known issues, and recommendations for next steps.

## Findings
We have had multiple internal play testing efforts, both to find bugs and to gauge the types of gameplay that players experience. In total, our play testing incorporated more than 12 unique individuals who played collectively more than 25 games. While certainly not large, this sample size is enough for us to gain some insights into the game and its implementation. The primary findings from players were: 

1) the fog of war component was reasonable and significantly changed how they played chess, 
2) the friction component was “frustrating” and may even need to be relaxed in future versions,
3) the composition component was attractive but selection focused mainly on traditional chess tactics and balance as opposed to selecting a flexible force to fit the asymmetric victory conditions, and 
4) the asymmetric victory conditions and non-zero-sum outcomes successfully captured the dynamics of competing under conflicting ends, leading to different play styles and strategies for different combinations of victory conditions. 

Our conclusion is that we have successfully modeled fog of war, friction, composition, and asymmetric ends within the game of chess. Additionally, we hypothesize that incorporating concepts into known games reduces some barriers for players to learn, exercise, or experience these concepts.

## Known Issues / Next Steps
We categorize future efforts along three main lines. The first is fixing errors and problems that exist in the code base. The second is improving, adjusting, or balancing existing game elements. Finally, the third category is progressing on additional features that do not exist. As a general note, the tool would benefit significantly from polishing and user interface improvements; unfortunately, this was out of scope for the current effort.

# Licenses ([BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause))
Copyright (c) 2019, Massachusetts Institute of Technology (MIT) All rights reserved. Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# Getting Started
## Prerequisites
The basic requirements for this application are node.js, socket.io, express.js, and mongodb. Please view the [companion guide PDF](Clausewitzian_Chess_v6.pdf) for more information regarding the game details, installation, etc...

## Contributing
- We except pull requests or issues for the following items (please be patient in our ressonses): 
    - Adding or Improving Existing Features:
    - Fixing a Bug
    - Refactoring / Tidying up
    - Alternative Implementations
- We understand the UI could use an overhaul. Any issues or PRs on this topic will be pushed to the backlog until we are able to dedicate the time to fix properly.
    - If you'd like to perform UI work, feel free to fork the repo in accordance with the lincese information.

## Documentation
Please view the [companion guide PDF](Clausewitzian_Chess_v6.pdf) for further documentation. Additional help on setting up and configuring and the mongodb database component can be found in the [database README](https://github.com/mit-ll/Clausewitzian_Chess/blob/master/database/README.md).
