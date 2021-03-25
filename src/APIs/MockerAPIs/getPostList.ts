import Tools from '../Tools'
import Mocker, { Post, promiseHelper } from './Mocker'

function getPostContent (post:Post) {
  if (post.postLevelList.length === 0) return ''
  const MAX_CONTENT_LENGTH = 50
  const DOT_LENGTH = 3
  let content = post.postLevelList[0].content
  if (content === '') return ''
  // content = content.replace(/<[^<>]+>/g, '')
  // content = Tools.htmlUnescape(content)
  content = Tools.extractTextFromHtml(content)
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH - DOT_LENGTH)
    return content.padEnd(MAX_CONTENT_LENGTH, '.')
  }
  return content
}

function getPostLastUpdateTimeString (post:Post) {
  if (post.postLevelList.length === 0) return ''
  const date = post.postLevelList[post.postLevelList.length - 1].date
  if (date.getFullYear() !== (new Date()).getFullYear()) {
    return Tools.getDateFullDate(date)
  }
  if (Tools.getDateDate(date) === Tools.getDateDate(new Date())) {
    return Tools.getDateTime(date)
  }
  return Tools.getDateDate(date)
}

function getImagesInPost (content:string) {
  const images = []
  const reg = /<img((?!scr=")[^<])+src="(([^"]|\\")*)"/gim
  let res = reg.exec(content)
  while (res !== null && images.length < 3) {
    images.push(Tools.htmlUnescape(res[2]))
    res = reg.exec(content)
  }
  return images
}

function genImage (small:string, big = '') {
  if (big === '') big = small
  else if (small === '') small = big
  return {
    big,
    small
  }
}

export default function (pageSize:number, pageNumber:number, filter:string):Promise<unknown> {
  const posts = []
  const res = Mocker.postHelper.getPosts(pageSize, pageNumber, filter)
  const rawPosts = res[0] as Array<Post>
  const postNum = res[1] as number
  for (const p of rawPosts) {
    const images:Array<Record<string, string>> = []
    const imageSources = p.postLevelList.length > 0 ? getImagesInPost(p.postLevelList[0].content) : []
    imageSources.forEach(i => {
      images.push(genImage(i))
    })

    const titleTags = []
    if (p.isPinned) titleTags.push({ type: 'warning', tag: 'Pin' })
    if (p.hasEdited()) titleTags.push({ type: 'info', tag: 'Edited' })

    posts.push({
      replyNum: p.getReplyNum(),
      title: p.title,
      titleTags,
      content: getPostContent(p),
      poster: Mocker.userHelper.getUserNameById(p.getPoster()),
      lastReplior: Mocker.userHelper.getUserNameById(p.getLastReplior()),
      updateTime: getPostLastUpdateTimeString(p),
      postId: p.postId,
      images
    })
  }
  return promiseHelper({ posts, postNum }, 1000)
}
