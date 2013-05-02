/**
 * Copyright (c) 2013 Kaj Magnus Lindberg (born 1979)
 */

package test.e2e

import org.openqa.selenium.Keys
import org.openqa.selenium.interactions.Actions
import com.debiki.v0.PageRole
import play.api.test.Helpers.testServerPort
import com.debiki.v0.Prelude._
import org.scalatest.time.{Seconds, Span}


/** Clicks and edits articles and comments.
  */
trait TestEditor {
  self: DebikiBrowserSpec =>


  /** Clicks on the specified post, selects Improve in the inline menu,
    * edits the post and verifies that the changes were probably saved.
    *
    * If the dashbar might appear later on, be sure to call waitForDashbar()
    * before this function, because otherwise this function might accidentally
    * click the wrong links, e.g. click "View page settings" in the dashbar.
    * (All functions in this file currently calls waitForDashbar() when needed,
    * I think.)
    */
  def clickAndEdit(postId: String, newText: String) {
    info("click #post-$postId, select Improve")

    var xOffset = 6
    var yOffset = 6

    eventually {
      // Find the elem to edit. And find it again, and again..., read on:
      // 1. The very first time we get to here, we need to wait until the elem
      // becomes visible (in case the page is loading).
      // 2. After we've found the elem once, we sometimes need to find it again!:
      // For unknown reasons, the WebDriver ID of `textElem` sometimes becomes
      // stale, just after the elem has been found. Chrome then complains that
      // "Element does not exist in cache", and throws a
      //    org.openqa.selenium.StaleElementReferenceException  when we perform()
      // the below moveToElement() command (which is relative `textElem`).
      // So find `textElem` again here, to refresh the id.
      // See:  http://seleniumhq.org/exceptions/stale_element_reference.html
      var textElem =
        find(cssSelector(s"#post-$postId .dw-p-bd-blk > *")) getOrElse fail()

      // Click text and select Improve.
      // There might be whitespace in `textElem`, but we need to click text for
      // the inline menu with the Improve button to appear. So click here and
      // there along a diagonal line, starting in the upper left corner. (Clicking
      // in the middle won't always work.)
      val textElemSize = textElem.underlying.getSize
      yOffset = if (textElemSize.height < yOffset) 3 else yOffset + yOffset / 3
      xOffset = if (textElemSize.width < xOffset) 3 else xOffset + xOffset / 3
      (new Actions(webDriver)).moveToElement(
        textElem.underlying, xOffset, yOffset).click().perform()

      // Sometimes some moveByOffset click apparently happens to open the editor,
      // so don't try to open it, if it's open already.
      if (findAnyEditorTextarea().isEmpty) {
        def findImproveBtn = find(cssSelector(".dw-a-edit-i"))
        val improveBtn = findImproveBtn getOrElse fail()
        click on improveBtn
        // Very infrequently, the first click on the Improve button does not
        // trigger any real click, but only selects it. So click the Improve
        // button again and again until it's gone.
        while (findImproveBtn != None)
          click on improveBtn
      }

      // Unless the editor appears within a few seconds, try again to click
      // text and select Improve. (Sometimes the above click on Improve has
      // no effect. Perhaps this could happen if the dashbar happens to be loaded
      // just after `moveToElement` (above) but before `click`? The dashbar pushes
      // elems downwards a bit, so we might click the wrong thing?)
      import org.scalatest.time.{Span, Seconds}
      eventually(Timeout(Span(3, Seconds))) {
        findAnyEditorTextarea() getOrElse fail()
      }
    }

    val prettyNewText = {
      val firstLine = newText.takeWhile(0 <= _ - ' ')
      if (firstLine.length <= 50) firstLine
      else firstLine.take(47) + "..."
    }

    info(s"edit text to: ``$prettyNewText''")

    // Wait for network request that loads editor data.
    // Then focus editor and send keys.
    // ((It doesn't seem possible to click on CodeMirror. But using `sendKeys`
    // directly works. Alternatively, executing this JS string:
    //   driver.asInstanceOf[JavascriptExecutor].executeScript(
    //      """window.editor.setValue("Hello");""")
    // is also supposed to work, see e.g.:
    //   https://groups.google.com/forum/?fromgroups=#!topic/webdriver/Rhm-NZRBgXY ))
    eventually {
      findAnyEditorTextarea().map(_.underlying) match {
        case None =>
          // Try again later; editor loaded via Ajax request.
          fail()
        case Some(textarea) =>
          // Select all current text.
          textarea.sendKeys(Keys.chord(Keys.SHIFT, Keys.CONTROL, Keys.END))
          // Overwrite selected text.
          textarea.sendKeys(newText)
      }
    }

    info("click preview, then submit")

    // The edit tab id ends with a serial number, which depends on how
    // many edit forms have already been opened. So match only on the
    // start of the edit tab id.
    click on cssSelector(s"#post-$postId a[href^='#dw-e-tab-prvw_sno-']")
    click on cssSelector(s"#post-$postId .dw-f-e .dw-fi-submit")

    info("find new text in page source")

    eventually {
      val isPendingModeration = findEditsPendingModerationMessage(postId).nonEmpty
      val isTextCorrectlyUpdated =
        find(cssSelector(s"#post-$postId .dw-p-bd")).map(_.text) ==
          Some(stripStartEndBlanks(newText))
      isPendingModeration must not be ===(isTextCorrectlyUpdated)
    }
  }


  private def findAnyEditorTextarea(): Option[Element] = {
    find(cssSelector(".CodeMirror textarea")) orElse
      find(cssSelector(".dw-e-tab textarea"))
  }


  private def findEditsPendingModerationMessage(postId: String): Option[Element] = {
    find(cssSelector(s"#post-$postId .dw-p-pending-mod"))
  }


  def clickViewEditSuggestions(postId: String) {
    val suggestionsLink = findActionLink_!(postId, "dw-a-pending-review")
    scrollIntoView(suggestionsLink)
    click on suggestionsLink
  }


  def clickApproveAnySuggestion() {
    val applySuggestionBtn =
      find(cssSelector("label[for^='dw-fi-appdel-apply-']")) getOrElse fail(
        "No suggestions to apply found for post `postId_ad1'")
    click on applySuggestionBtn
  }


  def submitEditSuggestionsForm() {
    click on cssSelector("#dw-e-sgs input[type='submit']")
  }

}
