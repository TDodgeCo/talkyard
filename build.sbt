name := "debiki-core"

organization := "com.debiki"

version := "0.0.2-SNAPSHOT"

scalaVersion := "2.10.0"

resolvers += "Scala-Tools Maven2 Repository" at "http://scala-tools.org/repo-releases"

libraryDependencies ++= Seq(
  "com.google.guava" % "guava" % "10.0.1",
  "commons-codec" % "commons-codec" % "1.5",
  "nu.validator.htmlparser" % "htmlparser" % "1.2.1",
  "junit" % "junit" % "4.7" % "test",
  "org.specs2" %% "specs2" % "1.14" % "test"
)

scalacOptions += "-deprecation"

// See: https://groups.google.com/forum/?fromgroups=#!topic/simple-build-tool/bkF1IDZj4L0
ideaPackagePrefix := None

