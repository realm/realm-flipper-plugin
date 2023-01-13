import Realm from 'realm';

export function createCornerCaseData(realm: Realm) {
  realm.write(() => {
    realm.delete(realm.objects('CornerCase'));
    realm.delete(realm.objects('NestedObject'));
  });
  realm.write(() => {
    var nestedObject: any = realm.create('NestedObject', {
      _id: 0,
    } as any);

    const cornerCase: any = {
      embedded: {
        items: ['one', 'two', 'three'],
      },
      mixed: null,
      indirectObject: nestedObject,
    };

    nestedObject.nestedObject = nestedObject;
    let cornerCaseObject: any = realm.create('CornerCase', cornerCase);
    nestedObject.cornerCase = cornerCaseObject;
    cornerCaseObject.indirectCycle = nestedObject;
    cornerCaseObject.directCycle = cornerCaseObject;

    const cornerCaseB: any = {
      embedded: {
        items: [],
      },
      mixed: null,
    };
    let cornerCaseObjectB: any = realm.create('CornerCase', cornerCaseB);

    cornerCaseObject.embedded.embeddedReference = cornerCaseObjectB;
  });
}
