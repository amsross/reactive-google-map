module.exports = function(grunt){

  grunt.initConfig({
    jshint: {
      files: ["Gruntfile.js", "src/js/**/*.js", "test/**/*.js"],
      options: {
        globals: {
          jQuery: true
        }
      }
    },
    uglify: {
      app: {
        files: {
          "build/js/app.min.js": [
            "src/js/app.js"
          ],
        },
        options: {
          sourceMap: true
        }
      },
      vendors: {
        files: {
          "build/js/vendors.min.js": [
            "src/bower_components/lodash/lodash.js",
            "src/bower_components/jquery/dist/jquery.js",
            "src/bower_components/highland/dist/highland.js",
          ]
        },
        options: {
          sourceMap: true
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 4000,
          base: "",
          open: true
        }
      }
    },
    watch: {
      html: {
        files: [
          "index.html",
        ]
      },
      jshint: {
        files: [
          "<%=jshint.files%>"
        ],
        tasks: [
          "jshint",
          "uglify:app"
        ]
      },
      vendors: {
        files: [
          "bower.json"
        ],
        tasks: [
          "uglify:vendors"
        ]
      },
      livereload: {
        options: {
          livereload: 4001
        },
        files: [
          "build/**/*.js",
          "locations.json",
          "index.html"
        ]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", [
    "jshint",
    "uglify"
  ]);
  grunt.registerTask("dev", [
    "jshint",
    "uglify",
    "connect",
    "watch"
  ]);

};
