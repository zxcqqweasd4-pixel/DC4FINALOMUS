import api from './api.js'

export async function fetchAllPaginated(endpoint, params = {}) {
  const firstPage = await api.get(endpoint, { params: { ...params, page: 1 } })
  const paginator = firstPage.data

  if (
    !paginator
    || !Array.isArray(paginator.data)
    || !Number.isInteger(paginator.last_page)
    || paginator.last_page < 1
  ) {
    throw new Error(`The ${endpoint} endpoint returned an invalid Laravel paginator response.`)
  }

  const pages = await Promise.all(
    Array.from({ length: Math.max(0, paginator.last_page - 1) }, (_, index) => (
      api.get(endpoint, { params: { ...params, page: index + 2 } })
    )),
  )
  const remainingRecords = pages.flatMap((response) => {
    if (!Array.isArray(response.data?.data)) {
      throw new Error(`The ${endpoint} endpoint returned an invalid Laravel paginator response.`)
    }
    return response.data.data
  })

  return [
    ...paginator.data,
    ...remainingRecords,
  ]
}
