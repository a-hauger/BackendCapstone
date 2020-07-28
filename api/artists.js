const express = require('express');
const sqlite3 = require('sqlite3');
const artistRouter = express({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const isValidArtist = (req, res, next) => {
    const artist = req.body.artist;
    artist.is_currently_employed === 0 ? req.body.artist.is_currently_employed = 0 : req.body.artist.is_currently_employed = 1;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        res.status(400).send('New artist does not include required fields');
    } else {
        next();
    }
};

artistRouter.param('artistId', (req, res, next, artistId) => {
    db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (err, artist) => {
        if (err) {
            next(err);
        } else if (artist) {
            req.artist = {artist: artist};
            next();
        } else {
            res.status(404).send();
        }
    });
});

artistRouter.get('/:artistId', (req, res, next) => {
    res.status(200).send(req.artist);
});

artistRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Artist WHERE is_currently_employed = 1", (err, row) => {
        if(err){
            next(err);
        } else {
        const employedArtists = row;
        res.status(200).send({ artists: employedArtists });
        }
    });
});

artistRouter.post('/', isValidArtist, (req, res, next) => {
    const artist = req.body.artist;
    db.run("INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)", {
        $name: artist.name,
        $dateOfBirth: artist.dateOfBirth,
        $biography: artist.biography,
        $isCurrentlyEmployed: artist.is_currently_employed
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get(`SELECT * FROM Artist WHERE id = $id`, {
                $id: this.lastID
            }, (err, artist) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(201).send({artist: artist});
                }
            });
        }
    });
});

artistRouter.put('/:artistId', isValidArtist, (req, res, next) => {
    const artist = req.body.artist;
    db.run("UPDATE Artist SET name = $name, date_of_birth = $date_of_birth, biography = $biography, is_currently_employed = $is_currently_employed WHERE id = $id", {
        $name: artist.name,
        $date_of_birth: artist.dateOfBirth,
        $biography: artist.biography,
        $is_currently_employed: artist.isCurrentlyEmployed,
        $id: req.params.artistId
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get("SELECT * FROM Artist WHERE id = $id", {
                $id: req.params.artistId
            }, (err, artist) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(200).send({artist: artist});
                }
            });
        }
    });
});

artistRouter.delete('/:artistId', (req, res, next) => {
    db.run("UPDATE Artist SET is_currently_employed = 0 WHERE id = $id", {
        $id: req.params.artistId
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get("SELECT * FROM Artist WHERE id = $id", {
                $id: req.params.artistId
            }, (err, artist) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(200).send({artist: artist});
                }
            });
        }
    })
})

module.exports = artistRouter;