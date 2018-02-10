module.exports = function (db) {
  var git = {}

  git.list = function (cb) {
    var latest = {}
    db.createHistoryStream()
      .on('data', function (node) {
        if (node.key.startsWith('/refs')) {
          latest[node.key] = node.value.toString()
        }
      })
      .once('end', function () {
        console.error('latest', latest)
        var res = Object.keys(latest).map(function (k) {
          return {
            name: k.substring(1),
            value: latest[k]
          }
        })
        console.error('res', res)
        cb(null, res)
      })
  }

  git.push = function (src, dst, refs, cb) {
    var pending = 0
    Object.keys(refs).forEach(function (ref, i) {
      if (ref === src) {
        pending++
        console.error('writing '+ref, refs[ref])
        db.put('/' + dst, refs[ref], function (err) {
          console.error('wrote', ref)
          if (err) return cb(err)
          if (!--pending) cb(null)
        })
        return
      }
      pending++
      console.error('writing /objects/'+ref, refs[ref].length)
      db.put('/objects/' + ref, refs[ref], function (err) {
        if (err) return cb(err)
        console.error('wrote', ref)
        if (!--pending) cb(null)
      })
    })
  }

  return git
}

