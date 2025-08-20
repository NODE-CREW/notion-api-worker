import { fetchPageById, fetchBlocks } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";
import { getTableData } from "./table";
import { BlockType, CollectionType, HandlerRequest } from "../api/types";

export async function pageRoute(req: HandlerRequest) {
  console.log("🚀 pageRoute 시작 - pageId:", req.params.pageId);
  console.log("🔑 notionToken 존재:", !!req.notionToken);
  
  try {
    const pageId = parsePageId(req.params.pageId);
    console.log("📄 파싱된 pageId:", pageId);
    
    if (!pageId) {
      console.error("❌ pageId가 유효하지 않습니다");
      return createResponse({ error: "Invalid page ID" }, {}, 400);
    }
    
    console.log("📡 fetchPageById 호출 중...");
    const page = await fetchPageById(pageId, req.notionToken);
    console.log("✅ fetchPageById 성공");
    console.log("📊 page 구조:", {
      hasRecordMap: !!page.recordMap,
      hasBlock: !!page.recordMap?.block,
      blockCount: Object.keys(page.recordMap?.block || {}).length
    });

    const baseBlocks = page.recordMap.block;
    console.log("🔧 baseBlocks 처리 시작");

    let allBlocks: { [id: string]: BlockType & { collection?: any } } = {
      ...baseBlocks,
    };
    let allBlockKeys;
    let iterationCount = 0;

    while (true) {
      iterationCount++;
      console.log(`🔄 블록 처리 반복 ${iterationCount}`);
      
      allBlockKeys = Object.keys(allBlocks);
      console.log(`📦 현재 총 블록 수: ${allBlockKeys.length}`);

      const pendingBlocks = allBlockKeys.flatMap((blockId) => {
        const block = allBlocks[blockId];
        const content = block.value && block.value.content;

        if (!content || (block.value.type === "page" && blockId !== pageId)) {
          return [];
        }

        return content.filter((id: string) => !allBlocks[id]);
      });

      console.log(`⏳ 대기 중인 블록 수: ${pendingBlocks.length}`);

      if (!pendingBlocks.length) {
        console.log("✅ 모든 블록 처리 완료");
        break;
      }

      console.log("📡 fetchBlocks 호출 중...");
      const newBlocks = await fetchBlocks(pendingBlocks, req.notionToken).then(
        (res) => res.recordMap.block
      );
      console.log(`📥 새로 가져온 블록 수: ${Object.keys(newBlocks).length}`);

      allBlocks = { ...allBlocks, ...newBlocks };
    }

    console.log("🏗️ 컬렉션 처리 시작");
    const collection = page.recordMap.collection
      ? page.recordMap.collection[Object.keys(page.recordMap.collection)[0]]
      : null;

    const collectionView = page.recordMap.collection_view
      ? page.recordMap.collection_view[
          Object.keys(page.recordMap.collection_view)[0]
        ]
      : null;

    console.log("📋 컬렉션 정보:", {
      hasCollection: !!collection,
      hasCollectionView: !!collectionView
    });

    if (collection && collectionView) {
      console.log("🔍 컬렉션 뷰 블록 찾는 중...");
      const pendingCollections = allBlockKeys.flatMap((blockId) => {
        const block = allBlocks[blockId];

        return (block.value && block.value.type === "collection_view") ? [block.value.id] : [];
      });

      console.log(`📊 처리할 컬렉션 수: ${pendingCollections.length}`);

      for (let b of pendingCollections) {
        console.log(`🔄 컬렉션 처리 중: ${b}`);
        try {
          const collPage = await fetchPageById(b!, req.notionToken);
          console.log(`✅ 컬렉션 페이지 가져오기 성공: ${b}`);

          const coll = Object.keys(collPage.recordMap.collection).map(
            (k) => collPage.recordMap.collection[k]
          )[0];

          const collView: {
            value: { id: CollectionType["value"]["id"] };
          } = Object.keys(collPage.recordMap.collection_view).map(
            (k) => collPage.recordMap.collection_view[k]
          )[0];

          console.log("📊 getTableData 호출 중...");
          const { rows, schema } = await getTableData(
            coll,
            collView.value.id,
            req.notionToken,
            true
          );
          console.log(`✅ 테이블 데이터 가져오기 성공 - 행 수: ${rows.length}`);

          const viewIds = (allBlocks[b] as any).value.view_ids as string[];

          allBlocks[b] = {
            ...allBlocks[b],
            collection: {
              title: coll.value.name,
              schema,
              types: viewIds.map((id) => {
                const col = collPage.recordMap.collection_view[id];
                return col ? col.value : undefined;
              }),
              data: rows,
            },
          };
          console.log(`✅ 컬렉션 블록 업데이트 완료: ${b}`);
        } catch (error) {
          console.error(`❌ 컬렉션 처리 중 에러 (${b}):`, error);
        }
      }
    }

    console.log("🎉 pageRoute 완료 - 응답 생성 중");
    return createResponse(allBlocks);
    
  } catch (error: any) {
    console.error("💥 pageRoute 에러:", error);
    console.error("📋 에러 스택:", error.stack);
    return createResponse(
      { 
        error: "Internal server error", 
        details: error.message,
        stack: error.stack 
      }, 
      {}, 
      500
    );
  }
}
