import Realm from 'realm';

const {UUID} = Realm.BSON;

export function createParcelTestData(realm: Realm) {
  realm.write(() => {
    realm.delete(realm.objects('Delivery'));
    realm.delete(realm.objects('Parcel'));
    realm.delete(realm.objects('ParcelService'));
    realm.delete(realm.objects('MailCarrier'));

    // realm.delete(realm.objects('AllTypes'));
    // realm.delete(realm.objects('Task'));
    // realm.delete(realm.objects('Banana'));
    // realm.delete(realm.objects('Maybe'));
    // realm.delete(realm.objects('Dict'));
    // realm.delete(realm.objects('NoPrimaryKey'));
    // realm.delete(realm.objects('Sets'));
  });

  const mailCarrierId1 = new UUID('7a003653-e92f-4e25-bb84-72c8442a176d');
  const mailCarrierId2 = new UUID();
  const mailCarrierId3 = new UUID();
  const mailCarrierId4 = new UUID();
  const mailCarrierId5 = new UUID();

  const parcelId1 = new UUID();
  const parcelId2 = new UUID();
  const parcelId3 = new UUID();
  const parcelId4 = new UUID();
  const parcelId5 = new UUID();
  const parcelId6 = new UUID();
  const parcelId7 = new UUID();
  const parcelId8 = new UUID();
  const parcelId9 = new UUID();
  const parcelId10 = new UUID();

  const parcelServiceId1 = new UUID();
  const parcelServiceId2 = new UUID();
  const parcelServiceId3 = new UUID();
  const parcelServiceId4 = new UUID();
  const parcelServiceId5 = new UUID();

  const deliveryId1 = new UUID();
  const deliveryId2 = new UUID();
  const deliveryId3 = new UUID();
  const deliveryId4 = new UUID();
  const deliveryId5 = new UUID();
  const deliveryId6 = new UUID();
  const deliveryId7 = new UUID();
  const deliveryId8 = new UUID();
  const deliveryId9 = new UUID();
  const deliveryId10 = new UUID();

  console.log('mailCarrierId1', mailCarrierId1);
  console.log('mailCarrierId2', mailCarrierId2);
  console.log('mailCarrierId3', mailCarrierId3);
  console.log('mailCarrierId4', mailCarrierId4);
  console.log('mailCarrierId5', mailCarrierId5);
  console.log('parcelId1', parcelId1);
  console.log('parcelId2', parcelId2);
  console.log('parcelId3', parcelId3);
  console.log('parcelId4', parcelId4);
  console.log('parcelId5', parcelId5);
  console.log('parcelId6', parcelId6);
  console.log('parcelId7', parcelId7);
  console.log('parcelId8', parcelId8);
  console.log('parcelId9', parcelId9);
  console.log('parcelId10', parcelId10);
  console.log('parcelServiceId1', parcelServiceId1);
  console.log('parcelServiceId2', parcelServiceId2);
  console.log('parcelServiceId3', parcelServiceId3);
  console.log('parcelServiceId4', parcelServiceId4);
  console.log('parcelServiceId5', parcelServiceId5);
  console.log('deliveryId1', deliveryId1);
  console.log('deliveryId2', deliveryId2);
  console.log('deliveryId3', deliveryId3);
  console.log('deliveryId4', deliveryId4);
  console.log('deliveryId5', deliveryId5);
  console.log('deliveryId6', deliveryId6);
  console.log('deliveryId7', deliveryId7);
  console.log('deliveryId8', deliveryId8);
  console.log('deliveryId9', deliveryId9);
  console.log('deliveryId10', deliveryId10);

  const MailCarrier1 = {
    _id: mailCarrierId1,
    name: 'Lesley Tennison',
    city: 'Dortmund',
    zipCode: '53968',
    street: 'Potsdamer Platz',
    houseNumber: '83',
    phoneNumber: '+49 7395328',
  };

  const MailCarrier2 = {
    _id: mailCarrierId2,
    name: 'Ariel Freeman',
    city: 'Copenhagen',
    zipCode: '2300',
    street: 'Amagerbrogade',
    houseNumber: '11',
    phoneNumber: '+45 947839',
  };

  const MailCarrier3 = {
    _id: mailCarrierId3,
    name: 'Harlow Norman',
    city: 'Copenhagen',
    zipCode: '2300',
    street: 'Njalsgade',
    houseNumber: '19D',
    phoneNumber: '+45 2435345',
  };

  const MailCarrier4 = {
    _id: mailCarrierId4,
    name: 'Favour Botwright',
    city: 'Copenhagen',
    zipCode: '2400',
    street: 'Nørrebrogade',
    houseNumber: '12',
    phoneNumber: '+45 2534323',
  };

  const MailCarrier5 = {
    _id: mailCarrierId5,
    name: 'Vivian Tailor',
    city: 'Copenhagen',
    zipCode: '2400',
    street: 'Englandsvej',
    houseNumber: '86',
    phoneNumber: '+45 232452',
  };

  realm.write(() => {
    realm.create('MailCarrier', MailCarrier1);
    realm.create('MailCarrier', MailCarrier2);
    realm.create('MailCarrier', MailCarrier3);
    realm.create('MailCarrier', MailCarrier4);
    realm.create('MailCarrier', MailCarrier5);
  });

  const parcelService1 = {
    _id: parcelServiceId1,
    name: 'UPS',
    city: 'Aarhus',
    zipCode: '1800',
    street: 'Parcel Vej',
    houseNumber: '14',
    mailCarrier: realm.objectForPrimaryKey('MailCarrier', mailCarrierId1),
  };

  const parcelService2 = {
    _id: parcelServiceId2,
    name: 'DHL',
    city: 'Aarhus',
    zipCode: '1800',
    street: 'Parcel Vej',
    houseNumber: '14',
    mailCarrier: realm.objectForPrimaryKey('MailCarrier', mailCarrierId2),
  };

  const parcelService3 = {
    _id: parcelServiceId3,
    name: 'DPD',
    city: 'Aarhus',
    zipCode: '1800',
    street: 'Parcel Vej',
    houseNumber: '14',
    mailCarrier: realm.objectForPrimaryKey('MailCarrier', mailCarrierId3),
  };

  const parcelService4 = {
    _id: parcelServiceId4,
    name: 'FedEx',
    city: 'Aarhus',
    zipCode: '1800',
    street: 'Parcel Vej',
    houseNumber: '14',
    mailCarrier: realm.objectForPrimaryKey('MailCarrier', mailCarrierId4),
  };

  const parcelService5 = {
    _id: parcelServiceId5,
    name: 'Postnord',
    city: 'Aarhus',
    zipCode: '1800',
    street: 'Parcel Vej',
    houseNumber: '14',
    mailCarrier: realm.objectForPrimaryKey('MailCarrier', mailCarrierId5),
  };

  realm.write(() => {
    realm.create('ParcelService', parcelService1);
    realm.create('ParcelService', parcelService2);
    realm.create('ParcelService', parcelService3);
    realm.create('ParcelService', parcelService4);
    realm.create('ParcelService', parcelService5);
  });

  const parcel1 = {
    _id: parcelId1,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel2 = {
    _id: parcelId2,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel3 = {
    _id: parcelId3,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel4 = {
    _id: parcelId4,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel5 = {
    _id: parcelId5,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel6 = {
    _id: parcelId6,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel7 = {
    _id: parcelId7,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel8 = {
    _id: parcelId8,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel9 = {
    _id: parcelId9,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  const parcel10 = {
    _id: parcelId10,
    length: 300,
    width: 400,
    height: 100,
    weight: 5,
  };

  realm.write(() => {
    realm.create('Parcel', parcel1);
    realm.create('Parcel', parcel2);
    realm.create('Parcel', parcel3);
    realm.create('Parcel', parcel4);
    realm.create('Parcel', parcel5);
    realm.create('Parcel', parcel6);
    realm.create('Parcel', parcel7);
    realm.create('Parcel', parcel8);
    realm.create('Parcel', parcel9);
    realm.create('Parcel', parcel10);
  });

  const delivery1 = {
    _id: deliveryId1,
    receiver: 'Regena Prescott',
    city: 'Stuttgart',
    zipCode: '48373',
    street: 'Porsche Str.',
    houseNumber: '911',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId1),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId4),
  };

  const delivery2 = {
    _id: deliveryId2,
    receiver: 'Naomi Rickard',
    city: 'London',
    zipCode: '3452',
    street: 'Picadilly Circus',
    houseNumber: '34',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId2),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId3),
  };

  const delivery3 = {
    _id: deliveryId3,
    receiver: 'Sophia Austis',
    city: 'London',
    zipCode: '3452',
    street: 'Picadilly Circus',
    houseNumber: '34',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId3),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId1),
  };

  const delivery4 = {
    _id: deliveryId4,
    receiver: 'Brook Watts',
    city: 'Copenhagen',
    zipCode: '2100',
    street: 'Kongens Nytorv',
    houseNumber: '125',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId4),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId5),
  };

  const delivery5 = {
    _id: deliveryId5,
    receiver: 'Devon Kay',
    city: 'Copenhagen',
    zipCode: '2100',
    street: 'Rantzausgade',
    houseNumber: '25',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId5),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId4),
  };

  const delivery6 = {
    _id: deliveryId6,
    receiver: 'Darcy Harlan',
    city: 'Copenhagen',
    zipCode: '2100',
    street: 'Kongens Nytorv',
    houseNumber: '125',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId6),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId1),
  };

  const delivery7 = {
    _id: deliveryId7,
    receiver: 'Reese Harper',
    city: 'Copenhagen',
    zipCode: '2100',
    street: 'Kongens Nytorv',
    houseNumber: '125',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId7),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId2),
  };

  const delivery8 = {
    _id: deliveryId8,
    receiver: 'Adam Wilkie',
    city: 'Stuttgart',
    zipCode: '48373',
    street: 'Porsche Str.',
    houseNumber: '911',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId8),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId4),
  };

  const delivery9 = {
    _id: deliveryId9,
    receiver: 'Riley Beasley',
    city: 'Copenhagen',
    zipCode: '2100',
    street: 'Kongens Nytorv',
    houseNumber: '125',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId9),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId2),
  };

  const delivery10 = {
    _id: deliveryId10,
    receiver: 'Lesley Elwin',
    city: 'Copenhagen',
    zipCode: '2300',
    street: 'Fasanvej',
    houseNumber: '43',
    parcel: realm.objectForPrimaryKey('Parcel', parcelId10),
    parcelService: realm.objectForPrimaryKey('ParcelService', parcelServiceId3),
  };

  realm.write(() => {
    realm.create('Delivery', delivery1);
    realm.create('Delivery', delivery2);
    realm.create('Delivery', delivery3);
    realm.create('Delivery', delivery4);
    realm.create('Delivery', delivery5);
    realm.create('Delivery', delivery6);
    realm.create('Delivery', delivery7);
    realm.create('Delivery', delivery8);
    realm.create('Delivery', delivery9);
    realm.create('Delivery', delivery10);
  });
}
