const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');
const seriesRouter = express({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.use('/:seriesId/issues', issuesRouter);

const isValidSeries = (req, res, next) => {
    const series = req.body.series;
    if (!series.name || !series.description){
        res.status(400).send('New series does not include required fields');
    } else {
        next();
    }
};

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get(`SELECT * FROM Series WHERE id = ${seriesId}`, (err, series) => {
        if (err) {
            next(err);
        } else if (series) {
            req.seriesId = seriesId;
            req.series = {series: series};
            next();
        } else {
            res.status(404).send();
        }
    });
});

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).send(req.series);
});

seriesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Series", (err, series) => {
        if(err){
            next(err);
        } else {
            res.status(200).send({series: series});
        }
    });
});

seriesRouter.post('/', isValidSeries, (req, res, next) => {
    const series = req.body.series;
    db.run("INSERT INTO Series (name, description) VALUES ($name, $description)", {
        $name: series.name,
        $description: series.description
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get("SELECT * FROM Series WHERE id = $id", {
                $id: this.lastID
            }, (err, series) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(201).send({series: series});
                }
            });
        }
    });
});

seriesRouter.put('/:seriesId', isValidSeries, (req, res, next) => {
    const series = req.body.series;
    db.run("UPDATE Series SET name = $name, description = $description WHERE id = $id", {
        $name: series.name,
        $description: series.description,
        $id: req.params.seriesId
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get("SELECT * FROM Series WHERE id = $id", {
                $id: req.params.seriesId
            }, (err, series) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(200).send({series: series});
                }
            });
        }
    });
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const series = req.body.series;
    db.get("SELECT * FROM Issue WHERE series_id = $series_id", {
        $series_id: req.params.seriesId
    }, (err, issues) => {
        if (err) {
            res.status(500).send();
        } else if (issues) {
            res.status(400).send("This series has related issues; cannot delete");
        } else {
            db.run("DELETE FROM Series WHERE id = $id", {
                $id: req.params.seriesId
            }, function(err){
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(204).send();
                }
            });
        }
    });
});

module.exports = seriesRouter;