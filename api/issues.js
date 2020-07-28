const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = express({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const isValidIssue = (req, res, next) => {
    const issue = req.body.issue;
    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId){
        res.status(400).send();
    } else {
        db.get("SELECT * FROM Artist WHERE id = $artistId", {
            $artistId: issue.artistId
        }, (err, artist) => {
            if (err) {
                next(err);
            } else if (!artist) {
                res.status(400).send();
            } else {
                next();
            }
        });
    }
};

issuesRouter.param('issueId', (req, res, next, issueId) => {
    db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (err, issue) => {
        if (err) {
            next(err);
        } else if (issue) {
            req.issueId = issueId;
            req.issue = {issue: issue};
            next();
        } else {
            res.status(404).send();
        }
    });
});

issuesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Issue WHERE Issue.series_id = $series_id", {
        $series_id: req.seriesId
    }, (err, issues) => {
        if (err) {
            next(err);
        } else {
            res.status(200).send({issues: issues})
        }
    });
});

issuesRouter.post('/', isValidIssue, (req, res, next) => {
    const issue = req.body.issue;
    db.run("INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issue_number, $publication_date, $artist_id, $series_id)", {
        $name: issue.name,
        $issue_number: issue.issueNumber,
        $publication_date: issue.publicationDate,
        $artist_id: issue.artistId,
        $series_id: req.seriesId
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get("SELECT * FROM Issue WHERE id = $id", {
                $id: this.lastID
            }, (err, issue) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(201).send({issue: issue});
                }
            });
        }
    });
});

issuesRouter.put('/:issueId', isValidIssue, (req, res, next) => {
    const issue = req.body.issue;
    db.run("UPDATE Issue SET name = $name, issue_number = $issue_number, publication_date = $publication_date, artist_id = $artist_id WHERE id = $id", {
        $name: issue.name,
        $issue_number: issue.issueNumber,
        $publication_date: issue.publicationDate,
        $artist_id: issue.artistId,
        $id: req.params.issueId
    }, function(err){
        if (err) {
            res.status(500).send();
        } else {
            db.get("SELECT * FROM Issue WHERE id = $id", {
                $id: req.params.issueId
            }, (err, issue) => {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(200).send({issue: issue});
                }
            });
        }
    });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run("DELETE FROM Issue WHERE id = $id", {
        $id: req.issueId
    }, function(err){
        if(err) {
            res.status(500).send();
        } else {
            res.status(204).send();
        }
    });
});

module.exports = issuesRouter;